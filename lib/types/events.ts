import type { ChatMessage, CounterState, Theme, User } from "./session";

export enum CollabEventType {
  PresenceJoin = "presence-join",
  PresenceLeave = "presence-leave",
  PresencePing = "presence-ping",
  ChatSend = "chat-send",
  ChatDelete = "chat-delete",
  Typing = "typing",
  CounterUpdate = "counter-update",
  RehydrateRequest = "rehydrate-request",
  RehydrateResponse = "rehydrate-response",
  ThemeUpdate = "theme-update",
  FocusUpdate = "focus-update",
}

export type PresenceJoinEvent = { type: CollabEventType.PresenceJoin; payload: User };
export type PresenceLeaveEvent = { type: CollabEventType.PresenceLeave; payload: User };
export type PresencePingEvent = { type: CollabEventType.PresencePing; payload: User };
export type ChatSendEvent = { type: CollabEventType.ChatSend; payload: ChatMessage };
export type ChatDeleteEvent = { type: CollabEventType.ChatDelete; payload: { id: string; userId: string } };
export type TypingEvent = { type: CollabEventType.Typing; payload: { userId: string; ts: number } };
export type CounterUpdateEvent = { type: CollabEventType.CounterUpdate; payload: CounterState };
export type RehydrateRequestEvent = { type: CollabEventType.RehydrateRequest; payload: { fromTabId: string } };
export type RehydrateResponseEvent = {
  type: CollabEventType.RehydrateResponse;
  payload: { toTabId: string; users: User[]; messages: ChatMessage[]; counter: CounterState; theme: Theme };
};
export type ThemeUpdateEvent = { type: CollabEventType.ThemeUpdate; payload: { theme: Theme } };
export type FocusUpdateEvent = { type: CollabEventType.FocusUpdate; payload: { userId: string; element: string; cursorPos?: number; ts: number } };

export type CollabEvent =
  | PresenceJoinEvent
  | PresenceLeaveEvent
  | PresencePingEvent
  | ChatSendEvent
  | ChatDeleteEvent
  | TypingEvent
  | CounterUpdateEvent
  | RehydrateRequestEvent
  | RehydrateResponseEvent
  | ThemeUpdateEvent
  | FocusUpdateEvent;

export const isCollabEventType = (value: unknown): value is CollabEventType =>
  typeof value === "string" && Object.values(CollabEventType).includes(value as CollabEventType);
