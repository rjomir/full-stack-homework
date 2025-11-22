import { renderHook, act } from "@testing-library/react";
import { useCollaborativeSession } from "@/lib/hooks/useCollaborativeSession";

jest.mock("react-broadcast-sync", () => {
  const React = require("react");
  let bus: Array<{ id: string; type: string; message: any }> = [];
  const subscribers = new Set<React.Dispatch<React.SetStateAction<any[]>>>();
  const notify = () => subscribers.forEach(set => set([...bus]));
  const push = (type: string, message: any) => { bus.push({ id: Math.random().toString(36).slice(2), type, message }); notify(); };
  return {
    useBroadcastChannel: () => {
      const [messages, setMessages] = React.useState(bus);
      React.useEffect(() => { subscribers.add(setMessages); return () => subscribers.delete(setMessages); }, []);
      return { messages, postMessage: push, clearReceivedMessages: ({ ids }: { ids: string[] }) => { bus = bus.filter(m => !ids.includes(m.id)); notify(); } };
    },
    __pushTestMessage: push,
  };
});

describe("activity feed", () => {
  beforeEach(() => { localStorage.clear(); });

  it("adds feed items for chat send and counter update", () => {
    const { result } = renderHook(() => useCollaborativeSession());
    act(() => result.current.sendMessage("hello world"));
    act(() => result.current.updateCounter(1));
    expect(result.current.feed.length).toBeGreaterThanOrEqual(2);
    const kinds = result.current.feed.map(f => f.kind);
    expect(kinds).toContain("chat:send");
    expect(kinds).toContain("counter:update");
  });
});
