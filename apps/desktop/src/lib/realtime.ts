import type { ServerMessage } from '@ish-maydoni/shared';

export interface SocketLike {
  onopen: (() => void) | null;
  onmessage: ((e: { data: unknown }) => void) | null;
  onclose: ((e: { code: number }) => void) | null;
  close(): void;
}

export interface RealtimeOptions {
  /** Full ws(s):// URL including the token, or null when signed out. */
  url(): string | null;
  onMessage(msg: ServerMessage): void;
  /** The server rejected the token (close code 4401); the client does not retry. */
  onUnauthorized?(): void;
  onStatus?(open: boolean): void;
  createSocket?(url: string): SocketLike;
}

export const BACKOFF_START_MS = 1000;
export const BACKOFF_MAX_MS = 30_000;
export const nextDelay = (current: number) => Math.min(current * 2, BACKOFF_MAX_MS);

/** WebSocket client with reconnect: 1 s → 2 s → … → 30 s, and an immediate retry when the browser goes online. */
export class RealtimeClient {
  private socket: SocketLike | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private delay = BACKOFF_START_MS;
  private running = false;

  constructor(private readonly o: RealtimeOptions) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    window.addEventListener('online', this.onOnline);
    this.connect();
  }

  stop(): void {
    this.running = false;
    window.removeEventListener('online', this.onOnline);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const s = this.socket;
    this.socket = null;
    if (s) {
      s.onclose = null;
      s.close();
    }
    this.o.onStatus?.(false);
  }

  private onOnline = () => {
    if (!this.running || this.socket) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.delay = BACKOFF_START_MS;
    this.connect();
  };

  private connect(): void {
    const url = this.o.url();
    if (!url) return;
    const socket = this.o.createSocket
      ? this.o.createSocket(url)
      : (new WebSocket(url) as unknown as SocketLike);
    this.socket = socket;
    socket.onopen = () => {
      this.delay = BACKOFF_START_MS;
      this.o.onStatus?.(true);
    };
    socket.onmessage = (e) => {
      try {
        this.o.onMessage(JSON.parse(String(e.data)) as ServerMessage);
      } catch {
        // ignore malformed frames
      }
    };
    socket.onclose = (e) => {
      this.socket = null;
      this.o.onStatus?.(false);
      if (!this.running) return;
      if (e.code === 4401) {
        this.running = false;
        window.removeEventListener('online', this.onOnline);
        this.o.onUnauthorized?.();
        return;
      }
      this.timer = setTimeout(() => {
        this.timer = null;
        this.connect();
      }, this.delay);
      this.delay = nextDelay(this.delay);
    };
  }
}
