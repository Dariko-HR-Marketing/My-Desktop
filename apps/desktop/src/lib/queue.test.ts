import { describe, expect, it } from 'vitest';
import { enqueue, pendingIds, remapTaskId, type QueueOp } from './queue';

const create = (taskId: string, title = 'a'): QueueOp => ({
  id: `c-${taskId}`,
  type: 'create',
  taskId,
  payload: { title },
});
const patch = (taskId: string, payload: object, id = `p-${Math.random()}`): QueueOp =>
  ({ id, type: 'patch', taskId, payload }) as QueueOp;
const del = (taskId: string): QueueOp => ({ id: `d-${taskId}`, type: 'delete', taskId });

describe('offline queue', () => {
  it('keeps operations in order', () => {
    const q = enqueue(enqueue([], create('local-1')), patch('srv-1', { priority: 'HIGH' }));
    expect(q.map((o) => o.type)).toEqual(['create', 'patch']);
  });

  it('merges consecutive patches of the same task, later values winning', () => {
    let q = enqueue([], patch('srv-1', { title: 'x', priority: 'LOW' }));
    q = enqueue(q, patch('srv-1', { priority: 'HIGH' }));
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ payload: { title: 'x', priority: 'HIGH' } });
  });

  it('folds field edits of a not-yet-created task into its create', () => {
    const q = enqueue(
      [create('local-1', 'old')],
      patch('local-1', { title: 'new', dueAt: '2026-10-29T10:00:00.000Z' }),
    );
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({
      type: 'create',
      payload: { title: 'new', dueAt: '2026-10-29T10:00:00.000Z' },
    });
  });

  it('keeps a status change as its own patch after the create', () => {
    const q = enqueue([create('local-1')], patch('local-1', { status: 'DONE' }));
    expect(q.map((o) => o.type)).toEqual(['create', 'patch']);
    expect(q[1]).toMatchObject({ payload: { status: 'DONE' } });
  });

  it('splits fields and status of one patch correctly', () => {
    const q = enqueue([create('local-1')], patch('local-1', { title: 'n', status: 'DONE' }));
    expect(q[0]).toMatchObject({ type: 'create', payload: { title: 'n' } });
    expect(q[1]).toMatchObject({ type: 'patch', payload: { status: 'DONE' } });
  });

  it('cancels everything for a task deleted before it was ever created', () => {
    let q = enqueue([create('local-1')], patch('local-1', { status: 'DONE' }));
    q = enqueue(q, create('local-2'));
    q = enqueue(q, del('local-1'));
    expect(q.map((o) => o.taskId)).toEqual(['local-2']);
  });

  it('drops earlier patches when deleting a server task', () => {
    const q = enqueue([patch('srv-1', { title: 'x' })], del('srv-1'));
    expect(q).toEqual([del('srv-1')]);
  });

  it('remaps a local id to the server id for later operations', () => {
    const q = remapTaskId(
      [patch('local-1', { status: 'DONE' }), patch('other', { title: 'y' })],
      'local-1',
      'srv-9',
    );
    expect(q.map((o) => o.taskId)).toEqual(['srv-9', 'other']);
  });

  it('reports which tasks have pending changes', () => {
    expect([...pendingIds([create('local-1'), patch('srv-2', { title: 'a' })])].sort()).toEqual([
      'local-1',
      'srv-2',
    ]);
  });

  it('never merges into the operation that is currently being sent', () => {
    const inFlight = patch('srv-1', { title: 'x' }, 'p-1');
    const q = enqueue([inFlight], patch('srv-1', { priority: 'HIGH' }, 'p-2'), 'p-1');
    expect(q).toHaveLength(2);
    expect(q[0]).toBe(inFlight);
    expect(q[1]).toMatchObject({ payload: { priority: 'HIGH' } });
  });

  it('does not cancel a create that is already in flight when its task is deleted', () => {
    const q = enqueue([create('local-1')], del('local-1'), 'c-local-1');
    expect(q.map((o) => o.type)).toEqual(['create', 'delete']);
  });
});
