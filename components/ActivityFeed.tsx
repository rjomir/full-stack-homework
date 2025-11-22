"use client";
import React from "react";
import type { FeedItem } from "@/lib/types/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

const KIND_LABEL: Record<string,string> = {
  "presence:join": "Joined",
  "presence:leave": "Left",
  "chat:send": "Message",
  "chat:delete": "Delete",
  "counter:update": "Counter",
  "theme": "Theme",
  "rehydrate": "Sync",
};

const kindColor = (kind: string) => {
  if (kind.startsWith("presence")) return "bg-sky-500";
  if (kind.startsWith("chat")) return "bg-purple-500";
  if (kind.startsWith("counter")) return "bg-amber-500";
  if (kind === "theme") return "bg-rose-500";
  if (kind === "rehydrate") return "bg-teal-500";
  return "bg-muted";
};

export const ActivityFeed = ({ items }: { items: FeedItem[] }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="h-5 w-5" /> Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map(i => (
              <li key={i.id} className="flex items-start gap-3 text-xs">
                <span className={`mt-0.5 h-3 w-3 rounded-full ${kindColor(i.kind)}`}></span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="font-medium">{KIND_LABEL[i.kind] ?? i.kind}</strong>
                    <span className="text-[10px] text-muted-foreground">{new Date(i.ts).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[11px] leading-snug text-muted-foreground break-words">{i.text}{i.actorName ? <span className="ml-1 text-foreground font-medium">({i.actorName})</span> : null}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
