import {
  defaultTo,
  groupBy,
  keyBy,
  maxBy,
  mergeWith,
  orderBy,
  values as objectValues,
} from "lodash-es";
import type { ChatMessage, CounterState, User } from "@/lib/types/session";

export const mergeUsers = (a: User[], b: User[]): User[] => {
  const combined = [...a, ...b];
  const groups = groupBy(combined, (u) => `${u.userId}:${u.tabId}`);
  return Object.values(groups)
    .map((arr) => maxBy(arr, (u) => defaultTo(u.lastActive, 0))!)
    .filter(Boolean) as User[];
};

export const sortUsers = (arr: User[], currentUserId?: string): User[] => {
  if (!currentUserId) {
    return orderBy(arr, [(u) => defaultTo(u.lastActive, 0)], ["desc"]);
  }
  return orderBy(
    arr,
    [
      (u) => (u.userId === currentUserId ? 1 : 0),
      (u) => defaultTo(u.lastActive, 0),
    ],
    ["desc", "desc"]
  );
};

export const mergeMessages = (a: ChatMessage[], b: ChatMessage[]): ChatMessage[] => {
  const aBy = keyBy(a, "id");
  const bBy = keyBy(b, "id");
  const merged = mergeWith({}, aBy, bBy, (va: ChatMessage, vb: ChatMessage) => {
    if (!va) return vb;
    if (!vb) return va;
    const ta = defaultTo(va.timestamp, 0);
    const tb = defaultTo(vb.timestamp, 0);
    if ((va.deleted ?? false) || (vb.deleted ?? false)) {
      const newer = tb > ta ? vb : va;
      return { ...newer, deleted: true } as ChatMessage;
    }
    return tb > ta ? vb : va;
  }) as Record<string, ChatMessage>;
  return orderBy(objectValues(merged), [(m: ChatMessage) => m.timestamp], ["asc"]);
};

export const chooseNewerCounter = (a: CounterState, b: CounterState): CounterState => {
  const at = defaultTo(a.lastUpdatedAt, 0);
  const bt = defaultTo(b.lastUpdatedAt, 0);
  return bt > at ? b : a;
};
