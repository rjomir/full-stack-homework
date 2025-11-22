import { renderHook } from "@testing-library/react";
import { useCollaborativeSession } from "@/lib/hooks/useCollaborativeSession";

jest.mock("react-broadcast-sync", () => {
  const listeners: Record<string, Function[]> = {};
  return {
    useBroadcastChannel: (name: string) => {
      return {
        messages: [],
        postMessage: (type: string, message: unknown) => {
          (listeners[name] || []).forEach(fn => fn({ id: Math.random().toString(), type, message }));
        },
        clearReceivedMessages: () => void 0,
      };
    },
  };
});

describe("useCollaborativeSession persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("persists userId across remounts", () => {
    const { result, unmount } = renderHook(() => useCollaborativeSession());
    const firstId = result.current.currentUser.userId;
    unmount();
    const { result: result2 } = renderHook(() => useCollaborativeSession());
    expect(result2.current.currentUser.userId).toBe(firstId);
  });

  it("assigns new userId for a simulated new tab (sessionStorage cleared)", () => {
    const { result, unmount } = renderHook(() => useCollaborativeSession());
    const firstId = result.current.currentUser.userId;
    unmount();
    const { result: result2 } = renderHook(() => useCollaborativeSession());
    expect(result2.current.currentUser.userId).toBe(firstId);
    sessionStorage.clear();
    const originalNanoid = require('nanoid').nanoid;
    (require('nanoid').nanoid as any) = () => 'test-id-2';
    const { result: result3 } = renderHook(() => useCollaborativeSession());
    expect(result3.current.currentUser.userId).toBe('test-id-2');
    expect(result3.current.currentUser.userId).not.toBe(firstId);
    (require('nanoid').nanoid as any) = originalNanoid;
  });
});
