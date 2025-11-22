"use client";
import React from "react";
import type { User } from "@/lib/types/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

type Props = {
  users: User[];
  currentUserId: string;
};

export const PresenceList = ({ users, currentUserId }: Props) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Active Users
          </CardTitle>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {users.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {users.map((u) => {
            const isSelf = u.userId === currentUserId;
            const lastSeen = new Date(u.lastActive).toLocaleTimeString();
            return (
              <li
                key={`${u.userId}:${u.tabId}`}
                className={`group flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all duration-300 animate-in fade-in ${
                  isSelf
                    ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50"
                }`}
                title={`tab: ${u.tabId}`}
              >
                <span
                  aria-label="online"
                  className="inline-block h-2.5 w-2.5 animate-pulse rounded-full"
                  style={{ background: u.avatarColor || "var(--primary)" }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-semibold">{u.username}</strong>
                    {isSelf && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {lastSeen}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PresenceList;
