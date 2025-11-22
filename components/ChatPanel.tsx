"use client";
import React, { useMemo } from "react";
import type { ChatMessage } from "@/lib/types/session";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Trash2, Clock, Send } from "lucide-react";

type Props = {
    messages: ChatMessage[];
    currentUserId: string;
    typingUsers: { userId: string; username: string }[];
    onSendAction: (text: string, opts?: { expiresInMs?: number }) => void;
    onDeleteAction: (id: string) => void;
    onTypingAction: () => void;
    onFocusUpdateAction?: (element: string, cursorPos?: number) => void;
};

export function ChatPanel({ messages, currentUserId, typingUsers, onSendAction, onDeleteAction, onTypingAction, onFocusUpdateAction }: Props) {
    const { register, handleSubmit, reset, watch } = useForm<{ text: string; expires: number | string }>({
        defaultValues: { text: "", expires: "0" },
    });

    const submit = handleSubmit(({ text, expires }) => {
        const content = (text ?? "").trim();
        if (!content) return;
        const expiresInMs = parseInt(String(expires || 0), 10) || 0;
        onSendAction(content, { expiresInMs: expiresInMs > 0 ? expiresInMs : undefined });
        reset({ text: "", expires });
    });

    const visibleMessages = useMemo(() => messages.filter((m) => !m.deleted), [messages]);
    const textValue = watch("text") ?? "";

    return (
        <Card className="flex h-[600px] flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Chat
                    {visibleMessages.length > 0 && (
                        <span className="ml-auto text-sm font-normal text-muted-foreground">
              {visibleMessages.length} message{visibleMessages.length !== 1 ? "s" : ""}
            </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-6">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                    {visibleMessages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                <p className="text-lg font-medium text-muted-foreground">No messages yet</p>
                                <p className="text-sm text-muted-foreground">Say hello to get started!</p>
                            </div>
                        </div>
                    ) : (
                        visibleMessages.map((m) => {
                            const isSelf = m.userId === currentUserId;
                            const time = new Date(m.timestamp).toLocaleTimeString();
                            const expiresIn = m.expiresAt ? m.expiresAt - Date.now() : 0;
                            return (
                                <div
                                    key={m.id}
                                    className={`group animate-in slide-in-from-bottom-2 rounded-xl border-2 p-4 transition-all ${
                                        isSelf
                                            ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 ml-8"
                                            : "border-border/50 bg-muted/50 mr-8"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                    isSelf ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                                } text-xs font-bold`}
                                            >
                                                {m.username.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <strong className="text-sm font-semibold">{m.username}</strong>
                                                    {isSelf && (
                                                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                              You
                            </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{time}</span>
                                            </div>
                                        </div>
                                        {isSelf && (
                                            <Button
                                                onClick={() => onDeleteAction(m.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="delete message"
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed pl-10">{m.text}</div>
                                    {m.expiresAt && (
                                        <div className="mt-2 flex items-center gap-1 text-xs text-warning font-medium pl-10">
                                            <Clock className="h-3 w-3" />
                                            <span>Expires {expiresIn > 0 ? `in ${Math.ceil(expiresIn / 1000)}s` : "soon"}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                {typingUsers.length > 0 && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="font-medium">{typingUsers.map((t) => t.username).join(", ")} typing...</span>
                    </div>
                )}
                <form onSubmit={submit} className="space-y-3 rounded-xl border-2 border-border/50 bg-muted/30 p-4">
                    <Textarea
                        placeholder="Type your message here..."
                        rows={3}
                        className="resize-none"
                        {...register("text", {
                            onChange: () => onTypingAction(),
                        })}
                        onFocus={(e) => onFocusUpdateAction?.("chat", e.currentTarget.selectionStart || 0)}
                        onKeyUp={(e) => onFocusUpdateAction?.("chat", e.currentTarget.selectionStart || 0)}
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="expires" className="text-xs font-medium">Auto-expire (optional)</Label>
                            <Input id="expires" type="number" min={0} step={1000} placeholder="0 (never)" {...register("expires")} />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={!textValue.trim()} size="lg" className="w-full sm:w-auto sm:min-w-[120px]">
                                <Send className="h-5 w-5" />
                                <span className="ml-2">Send</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default ChatPanel;
