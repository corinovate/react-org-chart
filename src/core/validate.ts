import { OrgChartError } from './types.js';
import type { Employee, OrgChartData } from './types.js';

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

/**
 * Minimal, dependency-free structural validation for untrusted JSON input.
 * Not a full schema validator by design — the core package stays small.
 */
export function validatePerson(value: unknown, index: number): asserts value is Employee {
  if (typeof value !== 'object' || value === null) {
    throw new OrgChartError(`people[${index}] must be an object`);
  }
  const p = value as Record<string, unknown>;
  if (!isString(p.id) || p.id.length === 0) {
    throw new OrgChartError(`people[${index}].id must be a non-empty string`);
  }
  if (!isString(p.name) || p.name.length === 0) {
    throw new OrgChartError(`people[${index}].id="${p.id}" is missing a valid "name"`);
  }
  if (p.managerId !== undefined && !isString(p.managerId)) {
    throw new OrgChartError(`people[${index}].id="${p.id}" has an invalid "managerId"`);
  }
}

export function validateTreeData(value: unknown): asserts value is OrgChartData {
  if (typeof value !== 'object' || value === null) {
    throw new OrgChartError('OrgChartData must be an object');
  }
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.people)) {
    throw new OrgChartError('OrgChartData.people must be an array');
  }
  data.people.forEach((p, i) => validatePerson(p, i));

  const ids = new Set<string>();
  for (const person of data.people as Employee[]) {
    if (ids.has(person.id)) {
      throw new OrgChartError(`Duplicate person id "${person.id}"`);
    }
    ids.add(person.id);
  }
  for (const person of data.people as Employee[]) {
    if (person.managerId !== undefined && !ids.has(person.managerId)) {
      throw new OrgChartError(
        `person "${person.id}" references unknown managerId "${person.managerId}"`,
      );
    }
  }
  if (data.rootId !== undefined && (!isString(data.rootId) || !ids.has(data.rootId))) {
    throw new OrgChartError(`rootId "${String(data.rootId)}" does not match any person`);
  }
}

/**
 * Detects whether setting `managerId` as `reportId`'s manager would create a cycle in the
 * management chain (reportId, transitively, is already a manager of managerId). A cyclic
 * management chain cannot be laid out by the tree layout engine, so this must be rejected
 * at the mutation boundary rather than surfacing as a layout crash.
 */
export function wouldCreateCycle(data: OrgChartData, managerId: string, reportId: string): boolean {
  if (managerId === reportId) return true;
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const visited = new Set<string>();
  let currentId: string | undefined = managerId;
  while (currentId !== undefined) {
    if (currentId === reportId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);
    currentId = byId.get(currentId)?.managerId;
  }
  return false;
}
