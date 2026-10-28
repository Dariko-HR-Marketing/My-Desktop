import type { ServerMessage } from '@ish-maydoni/shared';

export interface Connection {
  send(data: string): void;
}

/** Per-user fan-out of server → client messages. */
export class RealtimeHub {
  private readonly conns = new Map<string, Set<Connection>>();

  add(userId: string, conn: Connection): () => void {
    let set = this.conns.get(userId);
    if (!set) this.conns.set(userId, (set = new Set()));
    set.add(conn);
    return () => {
      set.delete(conn);
      if (set.size === 0) this.conns.delete(userId);
    };
  }

  publish(userId: string, message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const c of this.conns.get(userId) ?? []) {
      try {
        c.send(data);
      } catch {
        // a dead socket is removed by its own close handler
      }
    }
  }

  get size(): number {
    let n = 0;
    for (const s of this.conns.values()) n += s.size;
    return n;
  }
}
