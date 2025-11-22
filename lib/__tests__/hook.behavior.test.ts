import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useCollaborativeSession } from "@/lib/hooks/useCollaborativeSession";
import { CollabEventType } from "@/lib/types/events";

jest.mock("react-broadcast-sync", () => {
  const React = require("react");
  let bus: Array<{ id: string; type: string; message: any }> = [];
  const subscribers = new Set<React.Dispatch<React.SetStateAction<any[]>>>();
  const notify = () => {
    const snapshot = [...bus];
    subscribers.forEach(set => set(snapshot));
  };
  const push = (type: string, message: any) => {
    bus.push({ id: Math.random().toString(36).slice(2), type, message });
    notify();
  };
  return {
    useBroadcastChannel: () => {
      const [messages, setMessages] = React.useState(bus);
      React.useEffect(() => {
        subscribers.add(setMessages);
        return () => { subscribers.delete(setMessages); };
      }, []);
      const postMessage = (type: string, message: unknown) => push(type, message);
      const clearReceivedMessages = ({ ids }: { ids: string[] }) => {
        bus = bus.filter(m => !ids.includes(m.id));
        notify();
      };
      return { messages, postMessage, clearReceivedMessages };
    },
    __pushTestMessage: push,
  };
});

describe("useCollaborativeSession behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("counter update sets last actor fields", () => {
    const { result } = renderHook(() => useCollaborativeSession());
    act(() => result.current.updateCounter(3));
    expect(result.current.counter.value).toBe(3);
    expect(result.current.counter.lastActorId).toBe(result.current.currentUser.userId);
    expect(result.current.counter.lastActorName).toBe(result.current.currentUser.username);
    expect(result.current.counter.lastUpdatedAt).toBeGreaterThan(0);
  });

  it("message expiration removes expired messages after cleanup interval", () => {
    const { result } = renderHook(() => useCollaborativeSession());
    act(() => result.current.sendMessage("temp", { expiresInMs: 500 }));
    expect(result.current.messages).toHaveLength(1);
    act(() => { jest.advanceTimersByTime(600); });
    expect(result.current.messages).toHaveLength(1);
    act(() => { jest.advanceTimersByTime(1500); });
    expect(result.current.messages).toHaveLength(0);
  });

  it("cannot delete another user's message", () => {
    const { result } = renderHook(() => useCollaborativeSession());
    const remoteMsg = { id: "remote1", userId: "remote-user", username: "remote", text: "hello", timestamp: Date.now() };
    const { __pushTestMessage } = require("react-broadcast-sync");
    act(() => { __pushTestMessage(CollabEventType.ChatSend, remoteMsg); });
    expect(result.current.messages.find(m => m.id === "remote1")).toBeTruthy();
    act(() => result.current.deleteMessage("remote1"));
    const after = result.current.messages.find(m => m.id === "remote1");
    expect(after?.deleted).toBeFalsy();
  });
});
