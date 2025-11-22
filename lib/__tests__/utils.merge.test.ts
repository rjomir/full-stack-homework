import { mergeUsers, sortUsers, mergeMessages, chooseNewerCounter } from "@/lib/utils/merge";
import type { ChatMessage, CounterState, User } from "@/lib/types/session";

describe("merge utils", () => {
  test("mergeUsers prefers newer lastActive per userId:tabId", () => {
    const a: User[] = [
      { userId: "u1", username: "a", tabId: "t1", lastActive: 10 },
    ];
    const b: User[] = [
      { userId: "u1", username: "a2", tabId: "t1", lastActive: 20 },
      { userId: "u2", username: "b", tabId: "t2", lastActive: 15 },
    ];
    const merged = mergeUsers(a, b);
    const u1 = merged.find(u => u.userId === "u1" && u.tabId === "t1")!;
    expect(u1.lastActive).toBe(20);
    expect(merged).toHaveLength(2);
  });

  test("sortUsers orders by lastActive desc", () => {
    const users: User[] = [
      { userId: "a", username: "a", tabId: "t1", lastActive: 1 },
      { userId: "b", username: "b", tabId: "t2", lastActive: 3 },
      { userId: "c", username: "c", tabId: "t3", lastActive: 2 },
    ];
    const sorted = sortUsers(users);
    expect(sorted.map(u => u.userId)).toEqual(["b", "c", "a"]);
  });

  test("mergeMessages prefers deleted or newer timestamp", () => {
    const a: ChatMessage[] = [
      { id: "1", userId: "u", username: "x", text: "hi", timestamp: 1 },
    ];
    const b: ChatMessage[] = [
      { id: "1", userId: "u", username: "x", text: "hi2", timestamp: 2 },
      { id: "2", userId: "u", username: "x", text: "other", timestamp: 3, deleted: true },
    ];
    const c: ChatMessage[] = [
      { id: "2", userId: "u", username: "x", text: "should be deleted", timestamp: 4 },
    ];
    const merged = mergeMessages(mergeMessages(a, b), c);
    const m1 = merged.find(m => m.id === "1")!;
    const m2 = merged.find(m => m.id === "2")!;
    expect(m1.text).toBe("hi2");
    expect(m2.deleted).toBe(true);
  });

  test("chooseNewerCounter picks by lastUpdatedAt", () => {
    const a: CounterState = { value: 1, lastUpdatedAt: 10 };
    const b: CounterState = { value: 2, lastUpdatedAt: 20 };
    expect(chooseNewerCounter(a, b)).toBe(b);
    expect(chooseNewerCounter(b, a)).toBe(b);
  });
});
