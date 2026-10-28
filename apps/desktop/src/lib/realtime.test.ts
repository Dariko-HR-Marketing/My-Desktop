import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextDelay, RealtimeClient, type SocketLike } from './realtime';

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  close = vi.fn();
}

describe('realtime', () => {
  let sockets: FakeSocket[];
  beforeEach(() => {
    vi.useFakeTimers();
    // Node has no DOM: an EventTarget is enough for the 'online' listener.
    vi.stubGlobal('window', new EventTarget());
    sockets = [];
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const make = (extra: Partial<ConstructorParameters<typeof RealtimeClient>[0]> = {}) =>
    new RealtimeClient({
      url: () => 'ws://x/ws?token=t',
      onMessage: () => {},
      createSocket: () => {
        const s = new FakeSocket();
        sockets.push(s);
        return s;
      },
      ...extra,
    });

  it('doubles the delay up to 30 s', () => {
    expect([1000, 2000, 4000, 8000, 16000, 32000].map(nextDelay)).toEqual([
      2000, 4000, 8000, 16000, 30000, 30000,
    ]);
  });

  it('reconnects with backoff and resets after a successful open', () => {
    const c = make();
    c.start();
    sockets[0]!.onclose!({ code: 1006 });
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
    sockets[1]!.onclose!({ code: 1006 });
    vi.advanceTimersByTime(2000);
    expect(sockets).toHaveLength(3);
    sockets[2]!.onopen!();
    sockets[2]!.onclose!({ code: 1006 });
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(4);
    c.stop();
  });

  it('does not retry after 4401 and reports unauthorized', () => {
    const onUnauthorized = vi.fn();
    const c = make({ onUnauthorized });
    c.start();
    sockets[0]!.onclose!({ code: 4401 });
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('reconnects immediately when the browser goes online', () => {
    const c = make();
    c.start();
    sockets[0]!.onclose!({ code: 1006 });
    window.dispatchEvent(new Event('online'));
    expect(sockets).toHaveLength(2);
    c.stop();
  });

  it('parses messages and ignores malformed frames', () => {
    const onMessage = vi.fn();
    const c = make({ onMessage });
    c.start();
    sockets[0]!.onmessage!({ data: '{"type":"hello","payload":{"userId":"u"}}' });
    sockets[0]!.onmessage!({ data: 'not json' });
    expect(onMessage).toHaveBeenCalledTimes(1);
    c.stop();
  });

  it('stop() closes the socket and prevents reconnects', () => {
    const c = make();
    c.start();
    c.stop();
    expect(sockets[0]!.close).toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });
});
