import type { Employee, OrgChartData } from './types.js';
import { validateTreeData } from './validate.js';

/** The shape most "org chart" APIs actually return: a nested tree with `children` arrays,
 * rather than a flat list with `managerId` references. `id`/`managerId` here are optional
 * because a nested source often doesn't carry stable ids at all — flattenTree will generate
 * one per node when omitted. */
export type NestedEmployee = Omit<Employee, 'id' | 'managerId'> & {
  id?: string;
  children?: NestedEmployee[];
};

/**
 * Converts a nested `{ ...fields, children: [...] }` tree (or a forest — an array of such
 * roots) into the flat `{ people: [{ ...fields, managerId }] }` shape the rest of this package
 * works with. This is the shape most REST/GraphQL org APIs return, so it's usually the first
 * step between `fetch()` and `<OrgChart data={...} />`.
 */
export function flattenTree(root: NestedEmployee | NestedEmployee[]): OrgChartData {
  const people: Employee[] = [];
  let counter = 0;
  const generateNodeId = () => `node_${(counter += 1)}`;

  function visit(node: NestedEmployee, managerId: string | undefined): void {
    const { children, id, ...rest } = node;
    const nodeId = id ?? generateNodeId();
    people.push({ ...rest, id: nodeId, ...(managerId !== undefined ? { managerId } : {}) });
    for (const child of children ?? []) {
      visit(child, nodeId);
    }
  }

  const roots = Array.isArray(root) ? root : [root];
  for (const r of roots) visit(r, undefined);

  const data: OrgChartData = { people };
  validateTreeData(data);
  return data;
}
