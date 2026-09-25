import { describe, expect, it } from 'vitest';
import { flattenTree } from './flatten.js';

describe('flattenTree', () => {
  it('flattens a nested tree into a flat people list with managerId', () => {
    const data = flattenTree({
      id: 'alice',
      name: 'Alice',
      title: 'CEO',
      children: [
        { id: 'bob', name: 'Bob', title: 'CTO', children: [{ id: 'carol', name: 'Carol', title: 'Engineer' }] },
      ],
    });

    expect(data.people).toHaveLength(3);
    expect(data.people.find((p) => p.id === 'alice')?.managerId).toBeUndefined();
    expect(data.people.find((p) => p.id === 'bob')?.managerId).toBe('alice');
    expect(data.people.find((p) => p.id === 'carol')?.managerId).toBe('bob');
  });

  it('accepts a forest of multiple root nodes', () => {
    const data = flattenTree([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B', children: [{ id: 'c', name: 'C' }] },
    ]);
    expect(data.people.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(data.people.find((p) => p.id === 'c')?.managerId).toBe('b');
  });

  it('generates ids for nodes that arrive without one', () => {
    const data = flattenTree({ name: 'Alice', children: [{ name: 'Bob' }] });
    expect(data.people).toHaveLength(2);
    expect(data.people[0]!.id).toBeTruthy();
    expect(data.people[1]!.managerId).toBe(data.people[0]!.id);
  });

  it('drops the children field from the flattened employee record', () => {
    const data = flattenTree({ id: 'alice', name: 'Alice', children: [{ id: 'bob', name: 'Bob' }] });
    expect(data.people[0]).not.toHaveProperty('children');
  });
});
