# Cross‑Tab Collaboration Dashboard

Simple Next.js demo that syncs presence, a shared counter, chat (typing + delete‑own + expiration), and theme across browser tabs using `react-broadcast-sync`.

Open this page in multiple tabs to try it.

---

## Quick start

1) Install and run
```bash
pnpm install
pnpm dev
# then open http://localhost:3000
```

2) Optional: install the library directly (already listed in dependencies)
```bash
pnpm add react-broadcast-sync
```

---

## What’s inside

- Custom hook `useCollaborativeSession`
  - Uses `useBroadcastChannel('collab-dashboard')` from `react-broadcast-sync`
  - Presence: per‑tab join/leave + lastActive
  - Chat: send, delete own, timestamps, optional expiration, typing indicators (debounced)
  - Counter: synced value + last actor and time
  - Rehydration: new tab requests snapshot, existing tabs respond; merge is deterministic
  - Theme sync (bonus): toggled theme broadcasts to all tabs

- Components
  - `PresenceList` – active users with last seen
  - `SharedCounter` – inc/dec + last action
  - `ChatPanel` – messages, typing, delete‑own, expiration input

---

## How to test

1. Open two tabs at `http://localhost:3000`.
2. Type in one tab – the other shows a typing indicator.
3. Send a message, try deleting your own; add an expiration (ms) and watch it disappear.
4. Increment/decrement the counter – value and last actor/time stay in sync.
5. Toggle the theme – other tabs follow instantly.

---

## Notes

- User identity (`userId`) now persists per browser profile using `localStorage` (`collab_user_id`); opening new tabs shares the same user while each tab still has a unique `tabId` for presence granularity.
- The hook clears processed messages via `clearReceivedMessages` to avoid reprocessing.
- Expired messages are pruned every 2s.
- Presence pings every 5s to refresh `lastActive`.
- Identity (username) is deterministic from the stable `userId` via a hash (see `randomUsername`).
- Stale presence cleanup: tabs inactive >30s are pruned (unless it's your own user).
- Deterministic avatar colors derived from `userId` (see `avatarColorFromUserId`).
- Focus updates throttled (120ms) to reduce broadcast spam.
- Feed now includes expiration events (`chat:expire`).

---
