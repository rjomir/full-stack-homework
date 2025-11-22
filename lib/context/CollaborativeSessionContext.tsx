"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useCollaborativeSession } from "@/lib/hooks/useCollaborativeSession";
import type { ChatMessage, CounterState, Theme, User } from "@/lib/types/session";

type CollaborativeSessionContextType = {
  loading: boolean;
  users: User[];
  messages: ChatMessage[];
  counter: CounterState;
  typingUsers: { userId: string; username: string }[];
  theme: Theme;
  currentUser: User;
  sendMessage: (text: string, opts?: { expiresInMs?: number }) => void;
  deleteMessage: (id: string) => void;
  updateCounter: (delta: number) => void;
  markTyping: () => void;
  toggleTheme: () => void;
  feed: import("@/lib/types/session").FeedItem[];
  focus: import("@/lib/types/session").FocusState;
  updateFocus: (element: string, cursorPos?: number) => void;
};

const CollaborativeSessionContext = createContext<CollaborativeSessionContextType | null>(null);

type CollaborativeSessionProviderProps = {
  children: ReactNode;
};

export const CollaborativeSessionProvider = ({ children }: CollaborativeSessionProviderProps) => {
  const session = useCollaborativeSession();
  return <CollaborativeSessionContext.Provider value={session}>{children}</CollaborativeSessionContext.Provider>;
};

export const useCollaborativeSessionContext = () => {
  const context = useContext(CollaborativeSessionContext);
  if (!context) throw new Error("useCollaborativeSessionContext must be used within a CollaborativeSessionProvider");
  return context;
};
