"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useBroadcastChannel } from "react-broadcast-sync";
import { debounce as lodashDebounce } from "lodash-es";
import type { ChatMessage, CounterState, Theme, TypingState, User, FeedItem, FocusState } from "@/lib/types/session";
import { CollabEventType, type CollabEvent, isCollabEventType } from "@/lib/types/events";
import { mergeMessages, mergeUsers, sortUsers, chooseNewerCounter } from "@/lib/utils/merge";
import { randomUsername } from "@/lib/utils/identity";
import { avatarColorFromUserId } from "@/lib/utils/identity";

const CHANNEL_NAME = "collab-dashboard" as const;
const PRESENCE_PING_INTERVAL_MS = 5000;
const EXPIRY_CLEANUP_INTERVAL_MS = 2000;
const TYPING_DEBOUNCE_MS = 250;
const TYPING_VISIBLE_WINDOW_MS = 1500;
const THEME_STORAGE_KEY = "collab_theme";
const USER_ID_STORAGE_KEY = "collab_user_id"; // per-tab identity (sessionStorage)
const USER_ID_SALT_KEY = "collab_user_salt";
const STALE_USER_MS = 30000; // remove users inactive >30s
const FOCUS_THROTTLE_MS = 120; // throttle focus updates

export const useCollaborativeSession = () => {
  const { messages: busMessages, postMessage, clearReceivedMessages } = useBroadcastChannel(CHANNEL_NAME);
  const [tabId] = useState(() => nanoid());
  const [userId] = useState(() => {
    let existing: string | null = null;
    try { existing = sessionStorage.getItem(USER_ID_STORAGE_KEY); } catch { /* noop */ }
    if (!existing) {
      const salt = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
      try { sessionStorage.setItem(USER_ID_SALT_KEY, salt); } catch {}
      existing = nanoid();
      try { sessionStorage.setItem(USER_ID_STORAGE_KEY, existing); } catch { /* noop */ }
    }
    return existing;
  });
  const username = useMemo(() => randomUsername(userId), [userId]);

  const selfUserRef = useRef<User | null>(null);
  if (!selfUserRef.current) selfUserRef.current = { userId, username, tabId, lastActive: Date.now(), avatarColor: avatarColorFromUserId(userId) };
  const selfUser = selfUserRef.current;

  const [users, setUsers] = useState<User[]>([selfUser]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [counter, setCounter] = useState<CounterState>({ value: 0 });
  const [typing, setTyping] = useState<TypingState>({});
  const [theme, setTheme] = useState<Theme>("light");
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState<FocusState>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const pushFeed = useCallback((item: Omit<FeedItem, "id">) => {
    setFeed(prev => [{ id: nanoid(), ...item }, ...prev].slice(0, 100));
  }, []);

  const postMessageRef = useRef(postMessage);
  useEffect(() => { postMessageRef.current = postMessage; }, [postMessage]);

  const publish = useCallback((ev: CollabEvent) => {
    try { postMessageRef.current(ev.type, ev.payload as unknown); } catch (e) { console.warn("broadcast failed", e); }
  }, []);

  const snapshotRef = useRef({ users: [] as User[], messages: [] as ChatMessage[], counter: { value: 0 } as CounterState, theme: "light" as Theme });
  useEffect(() => { snapshotRef.current = { users, messages, counter, theme }; }, [users, messages, counter, theme]);

  useEffect(() => {
    if (!busMessages?.length) return;
    const idsToClear: string[] = [];
    for (const m of busMessages) {
      if (!isCollabEventType(m.type)) { idsToClear.push(m.id); continue; }
      const ev = { type: m.type, payload: m.message } as CollabEvent;
      switch (ev.type) {
        case CollabEventType.PresenceJoin:
        case CollabEventType.PresencePing: {
          const u = ev.payload as User;
          if (u.tabId === tabId) break;
          setUsers(prev => {
            const others = prev.filter(p => !(p.tabId === u.tabId && p.userId === u.userId));
            return [...others, { ...u, lastActive: Date.now() }];
          });
          if (ev.type === CollabEventType.PresenceJoin) pushFeed({ ts: Date.now(), kind: "presence:join", text: `${u.username} joined`, actorId: u.userId, actorName: u.username });
          break;
        }
        case CollabEventType.PresenceLeave: {
          const u = ev.payload as User;
            setUsers(prev => prev.filter(p => !(p.tabId === u.tabId && p.userId === u.userId)));
          pushFeed({ ts: Date.now(), kind: "presence:leave", text: `${u.username} left`, actorId: u.userId, actorName: u.username });
          break;
        }
        case CollabEventType.ChatSend: {
          const msg = ev.payload as ChatMessage;
          setMessages(prev => {
            const next = [...prev.filter(x => x.id !== msg.id), msg];
            return next.sort((a, b) => a.timestamp - b.timestamp);
          });
          if ((msg.userId !== userId)) pushFeed({ ts: Date.now(), kind: "chat:send", text: `${msg.username}: ${msg.text.slice(0,40)}` , actorId: msg.userId, actorName: msg.username});
          break;
        }
        case CollabEventType.ChatDelete: {
          const { id } = ev.payload as { id: string; userId: string };
          setMessages(prev => prev.map(x => x.id === id ? { ...x, deleted: true } : x));
          pushFeed({ ts: Date.now(), kind: "chat:delete", text: `message deleted`, actorId: (ev.payload as { id: string; userId: string }).userId, actorName: users.find(u=>u.userId===(ev.payload as { id: string; userId: string }).userId)?.username });
          break;
        }
        case CollabEventType.CounterUpdate: setCounter(ev.payload as CounterState); if (((ev.payload as CounterState).lastActorId !== userId)) pushFeed({ ts: Date.now(), kind: "counter:update", text: `counter -> ${(ev.payload as CounterState).value}`, actorId: (ev.payload as CounterState).lastActorId, actorName: (ev.payload as CounterState).lastActorName }); break;
        case CollabEventType.ThemeUpdate: setTheme((ev.payload as { theme: Theme }).theme); pushFeed({ ts: Date.now(), kind: "theme", text: `theme ${(ev.payload as { theme: Theme }).theme}`, actorId: userId, actorName: username }); break;
        case CollabEventType.FocusUpdate: {
          const f = ev.payload as { userId: string; element: string; cursorPos?: number; ts: number };
          setFocus((prev: FocusState) => ({ ...prev, [f.userId]: f }));
          break;
        }
        case CollabEventType.RehydrateRequest: {
          const { fromTabId } = ev.payload as { fromTabId: string };
          if (fromTabId === tabId) break;
          const snap = snapshotRef.current;
          publish({ type: CollabEventType.RehydrateResponse, payload: { toTabId: fromTabId, users: snap.users, messages: snap.messages, counter: snap.counter, theme: snap.theme } });
          break;
        }
        case CollabEventType.RehydrateResponse: {
          const payload = ev.payload as { toTabId: string; users: User[]; messages: ChatMessage[]; counter: CounterState; theme: Theme };
          if (payload.toTabId !== tabId) break;
          setUsers(prev => mergeUsers(prev, payload.users));
          setMessages(prev => mergeMessages(prev, payload.messages));
          setCounter(prev => chooseNewerCounter(prev, payload.counter));
          setTheme(payload.theme);
          setLoading(false);
          pushFeed({ ts: Date.now(), kind: "rehydrate", text: `state synced`, actorId: userId, actorName: username });
          break;
        }
        case CollabEventType.Typing: {
          const { userId: uid, ts } = ev.payload as { userId: string; ts: number };
          if (uid !== userId) {
            setTyping(prev => ({ ...prev, [uid]: ts }));
          }
          break;
        }
      }
      idsToClear.push(m.id);
    }
    if (idsToClear.length) clearReceivedMessages({ ids: idsToClear });
  }, [busMessages, clearReceivedMessages, publish, tabId]);

  useEffect(() => {
    const selfUserSnapshot = selfUserRef.current!;
    publish({ type: CollabEventType.PresenceJoin, payload: selfUserSnapshot });
    publish({ type: CollabEventType.RehydrateRequest, payload: { fromTabId: tabId } });
    const onUnload = () => publish({ type: CollabEventType.PresenceLeave, payload: selfUserSnapshot });
    window.addEventListener("beforeunload", onUnload);
    setUsers(prev => mergeUsers(prev, [selfUserSnapshot]));
    setLoading(false);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      publish({ type: CollabEventType.PresenceLeave, payload: selfUserSnapshot });
    };
  }, [publish, tabId]);

  useEffect(() => {
    const id = setInterval(() => {
      const selfUserSnapshot = selfUserRef.current!;
      publish({ type: CollabEventType.PresencePing, payload: { ...selfUserSnapshot, lastActive: Date.now() } });
    }, PRESENCE_PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [publish]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setUsers(prev => prev.filter(u => now - u.lastActive < STALE_USER_MS || u.userId === userId));
    }, 5000);
    return () => clearInterval(id);
  }, [userId]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      let expiredCount = 0;
      setMessages(prev => prev.filter(m => {
        const keep = !m.expiresAt || m.expiresAt > now;
        if (!keep) expiredCount++;
        return keep;
      }));
      if (expiredCount > 0) pushFeed({ ts: now, kind: "chat:expire", text: `${expiredCount} message${expiredCount>1?"s":""} expired`, actorId: userId, actorName: username });
    }, EXPIRY_CLEANUP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pushFeed]);

  const markTyping = useMemo(() => lodashDebounce(() => {
    setTyping(prev => ({ ...prev, [userId]: Date.now() }));
    publish({ type: CollabEventType.Typing, payload: { userId, ts: Date.now() } });
  }, TYPING_DEBOUNCE_MS), [publish, userId]);

  const sendMessage = useCallback((text: string, opts?: { expiresInMs?: number }) => {
    const now = Date.now();
    const msg: ChatMessage = { id: nanoid(), userId, username, text: text.trim(), timestamp: now, expiresAt: opts?.expiresInMs ? now + opts.expiresInMs : undefined };
    setMessages(prev => [...prev, msg]);
    pushFeed({ ts: Date.now(), kind: "chat:send", text: `${msg.username}: ${msg.text.slice(0,40)}`, actorId: msg.userId, actorName: msg.username });
    publish({ type: CollabEventType.ChatSend, payload: msg });
  }, [publish, userId, username, pushFeed]);

  const deleteMessage = useCallback((id: string) => {
    const target = messages.find(m => m.id === id);
    if (!target || target.userId !== userId) return;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, deleted: true } : m));
    publish({ type: CollabEventType.ChatDelete, payload: { id, userId } });
  }, [messages, publish, userId]);

  const updateCounter = useCallback((delta: number) => {
    const now = Date.now();
    setCounter(prev => {
      const next = { value: (prev?.value ?? 0) + delta, lastActorId: userId, lastActorName: username, lastUpdatedAt: now } as CounterState;
      pushFeed({ ts: Date.now(), kind: "counter:update", text: `counter -> ${next.value}`, actorId: userId, actorName: username });
      publish({ type: CollabEventType.CounterUpdate, payload: next });
      return next;
    });
  }, [publish, userId, username, pushFeed]);

  const updateFocus = useCallback((element: string, cursorPos?: number) => {
    if (!element) return;
    const now = Date.now();
    if ((updateFocus as any).last && now - (updateFocus as any).last < FOCUS_THROTTLE_MS) return;
    (updateFocus as any).last = now;
    const payload = { userId, element, cursorPos, ts: now };
    setFocus((prev: FocusState) => ({ ...prev, [userId]: payload }));
    publish({ type: CollabEventType.FocusUpdate, payload });
  }, [publish, userId]);

  const typingUsers = useMemo(() => {
    const now = Date.now();
    const ids = Object.entries(typing).filter(([uid, ts]) => uid !== userId && now - ts < TYPING_VISIBLE_WINDOW_MS).map(([uid]) => uid);
    const map = new Map(users.map(u => [u.userId, u.username] as const));
    return ids.map(id => ({ userId: id, username: map.get(id) ?? id }));
  }, [typing, users, userId]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === "light" ? "dark" : "light";
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
      publish({ type: CollabEventType.ThemeUpdate, payload: { theme: next } });
      return next;
    });
  }, [publish]);

  useEffect(() => { if (typeof document !== "undefined") document.documentElement.dataset.theme = theme; }, [theme]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored && stored !== theme) {
        setTheme(stored);
      }
    } catch { /* ignore */ }
  }, []);

  return {
    loading,
    users: sortUsers(users, userId),
    messages,
    counter,
    typingUsers,
    theme,
    currentUser: selfUser,
    sendMessage,
    deleteMessage,
    updateCounter,
    markTyping,
    toggleTheme,
    feed,
    focus,
    updateFocus,
  } as const;
};
