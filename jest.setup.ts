import '@testing-library/jest-dom';
// Mock react-broadcast-sync to avoid cross-tab side effects in tests
// Provide a shared channel instance with spies to assert calls
const channelData: { bus: Array<{id:string; type:string; message:any}>; subs: Set<(msgs:any[])=>void> } = { bus: [], subs: new Set() };
function useBroadcastChannelMock() {
  const React = require('react');
  const [messages, setMessages] = React.useState(channelData.bus);
  React.useEffect(() => {
    channelData.subs.add(setMessages);
    return () => { channelData.subs.delete(setMessages); };
  }, []);
  const broadcastUpdate = () => {
    channelData.bus = [...channelData.bus];
    channelData.subs.forEach(fn => fn(channelData.bus));
  };
  const postMessage = (type: string, message: any) => {
    channelData.bus.push({ id: Math.random().toString(36), type, message });
    broadcastUpdate();
  };
  const clearReceivedMessages = ({ ids }: { ids: string[] }) => {
    channelData.bus = channelData.bus.filter(m => !ids.includes(m.id));
    broadcastUpdate();
  };
  return { messages, postMessage, clearReceivedMessages };
}
jest.mock('react-broadcast-sync', () => ({ useBroadcastChannel: () => useBroadcastChannelMock() }));
// Mock nanoid to avoid ESM transform issues and to produce stable IDs in tests
let __idCounter = 0;
jest.mock('nanoid', () => ({ nanoid: () => `test-id-${++__idCounter}` }));
// Note: IDs in app code use nanoid; no crypto.randomUUID polyfill needed
