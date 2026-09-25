import { describe, expect, it } from 'vitest';
import { computeLayout } from './layout.js';
import type { OrgChartData } from './types.js';

describe('computeLayout', () => {
  it('places a manager above their direct report with a connecting edge', () => {
    const data: OrgChartData = {
      people: [
        { id: 'alice', name: 'Alice', title: 'CEO' },
        { id: 'bob', name: 'Bob', title: 'CTO', managerId: 'alice' },
      ],
    };
    const result = computeLayout(data);
    expect(result.nodes).toHaveLength(2);

    const alice = result.nodes.find((n) => n.personId === 'alice')!;
    const bob = result.nodes.find((n) => n.personId === 'bob')!;
    expect(bob.y).toBeGreaterThan(alice.y);

    const edge = result.edges.find((e) => e.kind === 'manager-report')!;
    expect(edge).toBeDefined();
    expect(edge.from.y).toBeLessThan(edge.to.y);
  });

  it('lays out multiple direct reports side by side under their shared manager', () => {
    const data: OrgChartData = {
      people: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob', managerId: 'alice' },
        { id: 'carol', name: 'Carol', managerId: 'alice' },
      ],
    };
    const result = computeLayout(data);
    const bob = result.nodes.find((n) => n.personId === 'bob')!;
    const carol = result.nodes.find((n) => n.personId === 'carol')!;
    expect(bob.y).toBe(carol.y);
    expect(bob.x).not.toBe(carol.x);
  });

  it('places multiple root trees side by side without overlapping', () => {
    const data: OrgChartData = {
      people: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    };
    const result = computeLayout(data);
    const [a, b] = result.nodes;
    expect(a!.x).not.toBe(b!.x);
  });

  it('colors an edge using the report (child)\'s own color, not the manager\'s', () => {
    const data: OrgChartData = {
      people: [
        { id: 'alice', name: 'Alice', color: '#111111' },
        { id: 'bob', name: 'Bob', managerId: 'alice', color: '#7c5cff' },
        { id: 'carol', name: 'Carol', managerId: 'alice' },
      ],
    };
    const result = computeLayout(data);
    const bobEdge = result.edges.find((e) => e.id.endsWith('->bob'))!;
    const carolEdge = result.edges.find((e) => e.id.endsWith('->carol'))!;
    expect(bobEdge.color).toBe('#7c5cff');
    expect(carolEdge.color).toBeUndefined();
  });

  it('does not throw on an empty chart', () => {
    const result = computeLayout({ people: [] });
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});
