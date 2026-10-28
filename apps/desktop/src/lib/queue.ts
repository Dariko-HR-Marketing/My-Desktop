export interface CreatePayload {
  title: string;
  notes?: string | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  dueAt?: string | null;
  assignee?: string | null;
  list?: string | null;
}

export interface PatchPayload extends Partial<CreatePayload> {
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
}

export type QueueOp =
  | { id: string; type: 'create'; taskId: string; payload: CreatePayload }
  | { id: string; type: 'patch'; taskId: string; payload: PatchPayload }
  | { id: string; type: 'delete'; taskId: string };

export const isLocalId = (id: string) => id.startsWith('local-');

/**
 * Adds an operation to the offline queue, folding it into earlier ones where that is lossless:
 *  - edits to a task that is still only queued for creation go into the create (status stays a separate patch);
 *  - consecutive patches of one task merge;
 *  - deleting a task that was never created cancels everything queued for it.
 */
export function enqueue(queue: QueueOp[], op: QueueOp, lockedId?: string): QueueOp[] {
  // The operation currently being sent must not change under it, so it is never a merge target.
  const live = queue.filter((q) => q.id !== lockedId);
  if (op.type === 'delete') {
    const created = live.some((q) => q.type === 'create' && q.taskId === op.taskId);
    const rest = queue.filter((q) => q.taskId !== op.taskId || q.id === lockedId);
    return created ? rest : [...rest, op];
  }

  if (op.type === 'patch') {
    const { status, ...fields } = op.payload;
    let next = queue;
    if (Object.keys(fields).length > 0) {
      const create = live.find((q) => q.type === 'create' && q.taskId === op.taskId);
      if (create && create.type === 'create') {
        next = next.map((q) =>
          q === create
            ? { ...create, payload: { ...create.payload, ...fields } as CreatePayload }
            : q,
        );
      } else {
        next = mergePatch(next, op.taskId, fields, op.id, lockedId);
      }
    }
    if (status !== undefined)
      next = mergePatch(next, op.taskId, { status }, `${op.id}-s`, lockedId);
    return next;
  }

  return [...queue, op];
}

function mergePatch(
  queue: QueueOp[],
  taskId: string,
  payload: PatchPayload,
  id: string,
  lockedId?: string,
): QueueOp[] {
  const existing = queue.find(
    (q) => q.type === 'patch' && q.taskId === taskId && q.id !== lockedId,
  );
  if (existing && existing.type === 'patch') {
    return queue.map((q) =>
      q === existing ? { ...existing, payload: { ...existing.payload, ...payload } } : q,
    );
  }
  return [...queue, { id, type: 'patch', taskId, payload }];
}

/** After a queued create succeeds, later operations on its local id must target the server id. */
export function remapTaskId(queue: QueueOp[], from: string, to: string): QueueOp[] {
  return queue.map((q) => (q.taskId === from ? { ...q, taskId: to } : q));
}

export const pendingIds = (queue: QueueOp[]): Set<string> => new Set(queue.map((q) => q.taskId));

const KEY = 'ish-queue';

export function loadQueue(): QueueOp[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueueOp[]) : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue: QueueOp[]): void {
  try {
    if (queue.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // best effort: without storage the queue just won't survive a restart
  }
}
