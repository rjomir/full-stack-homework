"use client";
import React from "react";
import type { CounterState } from "@/lib/types/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash } from "lucide-react";

type Props = {
  counter: CounterState;
  onChangeAction: (delta: number) => void;
};

export const SharedCounter = ({ counter, onChangeAction }: Props) => {
  const last = counter.lastUpdatedAt ? new Date(counter.lastUpdatedAt).toLocaleTimeString() : "-";
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Hash className="h-5 w-5" />
          <span>Shared Counter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border/40 bg-gradient-to-br from-muted/40 to-muted/20 p-4 shadow-sm">
          <Button
            onClick={() => onChangeAction(-1)}
            aria-label="decrement"
            variant="outline"
            size="sm"
            className="h-12 w-12 rounded-lg text-lg font-bold hover:scale-[1.03] transition-transform"
          >
            −
          </Button>
          <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
            {counter.value}
          </div>
          <Button
            onClick={() => onChangeAction(1)}
            aria-label="increment"
            variant="outline"
            size="sm"
            className="h-12 w-12 rounded-lg text-lg font-bold hover:scale-[1.03] transition-transform"
          >
            +
          </Button>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
            {counter.lastActorName ? (
              <>Last updated by <span className="font-semibold text-foreground">{counter.lastActorName}</span> at {last}</>
            ) : (
              "No updates yet"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SharedCounter;
