"use client";
import React from "react";
import { useCollaborativeSessionContext } from "@/lib/context/CollaborativeSessionContext";
import PresenceList from "@/components/PresenceList";
import SharedCounter from "@/components/SharedCounter";
import ChatPanel from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";

export default function Home() {
  const {
    loading,
    users,
    messages,
    counter,
    typingUsers,
    theme,
    currentUser,
    sendMessage,
    deleteMessage,
    updateCounter,
    markTyping,
    toggleTheme,
    feed,
    focus,
    updateFocus,
  } = useCollaborativeSessionContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaboration Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Real-time collaboration across browser tabs</p>
          </div>
          <Button
            onClick={toggleTheme}
            type="button"
            aria-label="Switch theme"
            aria-pressed={theme === "dark"}
            title="Switch theme"
            variant="outline"
            size="default"
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted/70 transition-colors"
          >
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === "light" ? "Light" : "Dark"}</span>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </header>

        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-lg text-muted-foreground">Loading session…</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-1">
              <PresenceList users={users} currentUserId={currentUser.userId} />
              <SharedCounter counter={counter} onChangeAction={updateCounter} />
            </div>
            <div className="lg:col-span-2">
              <ChatPanel
                messages={messages}
                currentUserId={currentUser.userId}
                typingUsers={typingUsers}
                onSendAction={sendMessage}
                onDeleteAction={deleteMessage}
                onTypingAction={markTyping}
                onFocusUpdateAction={updateFocus}
              />
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityFeed items={feed} />
                <div className="rounded-xl border border-border/50 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Focus Indicators</h3>
                  <ul className="space-y-2 text-xs">
                    {Object.entries(focus).filter(([uid]) => uid !== currentUser.userId).map(([uid, f]) => (
                      <li key={uid} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span>{users.find(u => u.userId === uid)?.username ?? uid} focusing {f.element}{typeof f.cursorPos === 'number' ? ` @${f.cursorPos}` : ''}</span>
                      </li>
                    ))}
                    {Object.entries(focus).filter(([uid]) => uid !== currentUser.userId).length === 0 && (
                      <li className="text-muted-foreground">No other user focus</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
