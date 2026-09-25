import { describe, expect, it } from 'vitest';
import { addPerson, addRelationship, removePerson, removeRelationship, updatePerson } from './mutations.js';
import type { OrgChartData } from './types.js';

function baseData(): OrgChartData {
  return {
    people: [
      { id: 'alice', name: 'Alice', title: 'CEO' },
      { id: 'bob', name: 'Bob', title: 'CTO', managerId: 'alice' },
      { id: 'carol', name: 'Carol', title: 'Engineer', managerId: 'bob' },
    ],
  };
}

describe('addPerson', () => {
  it('adds a person immutably', () => {
    const data = baseData();
    const next = addPerson(data, { id: 'dave', name: 'Dave' });
    expect(data.people).toHaveLength(3);
    expect(next.people).toHaveLength(4);
    expect(next.people.find((p) => p.id === 'dave')?.name).toBe('Dave');
  });

  it('rejects a duplicate id', () => {
    const data = baseData();
    expect(() => addPerson(data, { id: 'alice', name: 'Alice 2' })).toThrow();
  });
});

describe('removePerson', () => {
  it('clears the removed person from any direct report\'s managerId without deleting others by default', () => {
    const data = baseData();
    const next = removePerson(data, 'bob');
    expect(next.people.map((p) => p.id)).toEqual(['alice', 'carol']);
    expect(next.people.find((p) => p.id === 'carol')?.managerId).toBeUndefined();
  });

  it('cascade removes the whole reporting chain below the removed person', () => {
    const data = baseData();
    const next = removePerson(data, 'alice', { cascade: true });
    expect(next.people.map((p) => p.id)).toEqual([]);
  });

  it('throws for an unknown id', () => {
    const data = baseData();
    expect(() => removePerson(data, 'nope')).toThrow();
  });
});

describe('updatePerson', () => {
  it('merges updates into an existing person immutably', () => {
    const data = baseData();
    const next = updatePerson(data, 'bob', { color: '#7c5cff', icon: '💻' });
    expect(data.people.find((p) => p.id === 'bob')?.color).toBeUndefined();
    expect(next.people.find((p) => p.id === 'bob')).toMatchObject({ color: '#7c5cff', icon: '💻', title: 'CTO' });
  });

  it('throws for an unknown id', () => {
    const data = baseData();
    expect(() => updatePerson(data, 'nope', { color: 'red' })).toThrow();
  });
});

describe('addRelationship / removeRelationship', () => {
  it('adds and removes a manager-report relationship symmetrically', () => {
    const data: OrgChartData = {
      people: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    };
    const withManager = addRelationship(data, { type: 'manager-report', managerId: 'a', reportId: 'b' });
    expect(withManager.people.find((p) => p.id === 'b')?.managerId).toBe('a');

    const withoutManager = removeRelationship(withManager, { type: 'manager-report', managerId: 'a', reportId: 'b' });
    expect(withoutManager.people.find((p) => p.id === 'b')?.managerId).toBeUndefined();
  });

  it('rejects a manager-report relationship that would create a cycle', () => {
    const data = baseData();
    expect(() =>
      addRelationship(data, { type: 'manager-report', managerId: 'carol', reportId: 'alice' }),
    ).toThrow();
  });

  it('rejects setting a second manager without first removing the existing one', () => {
    const data = baseData();
    const withThird = addPerson(data, { id: 'eve', name: 'Eve' });
    expect(() =>
      addRelationship(withThird, { type: 'manager-report', managerId: 'eve', reportId: 'carol' }),
    ).toThrow();
  });
});
