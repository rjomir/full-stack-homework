export type User = {
  userId: string;
  username: string;
  tabId: string;
  lastActive: number;
  avatarColor?: string;
};

export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  expiresAt?: number;
  deleted?: boolean;
};

export type CounterState = {
  value: number;
  lastActorId?: string;
  lastActorName?: string;
  lastUpdatedAt?: number;
};

export type TypingState = Record<string, number>;

export type FocusState = Record<string, { element: string; cursorPos?: number; ts: number }>; // focus/cursor indicators

export type FeedItem = { id: string; ts: number; kind: string; text: string; actorId?: string; actorName?: string }; // activity feed entry

export type Theme = "light" | "dark";
