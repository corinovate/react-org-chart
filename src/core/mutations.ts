import { OrgChartError } from './types.js';
import type { Employee, OrgChartData } from './types.js';
import { validateTreeData, wouldCreateCycle } from './validate.js';

export type Relationship = { type: 'manager-report'; managerId: string; reportId: string };

function findPerson(data: OrgChartData, id: string): Employee {
  const person = data.people.find((p) => p.id === id);
  if (!person) {
    throw new OrgChartError(`No person with id "${id}"`);
  }
  return person;
}

function withPerson(
  data: OrgChartData,
  id: string,
  update: (person: Employee) => Employee,
): OrgChartData {
  return {
    ...data,
    people: data.people.map((p) => (p.id === id ? update(p) : p)),
  };
}

/** Adds a new person to the chart. Immutable: returns a new OrgChartData. */
export function addPerson(data: OrgChartData, person: Employee): OrgChartData {
  const next: OrgChartData = { ...data, people: [...data.people, person] };
  validateTreeData(next);
  return next;
}

/**
 * Merges `updates` into an existing person's fields — for editing a person's own data
 * (name, title, color, icon, ...), not their place in the reporting chain. Use
 * `addRelationship`/`removeRelationship` to change `managerId`; passing it here is allowed
 * but skips the cycle/duplicate-manager checks those perform.
 */
export function updatePerson(
  data: OrgChartData,
  personId: string,
  updates: Partial<Omit<Employee, 'id'>>,
): OrgChartData {
  findPerson(data, personId);
  const next = withPerson(data, personId, (p) => ({ ...p, ...updates }));
  validateTreeData(next);
  return next;
}

/**
 * Removes a person and clears them from any direct report's managerId.
 * With `cascade: true`, also recursively removes every descendant in that
 * person's reporting chain, rather than leaving orphaned reports behind.
 */
export function removePerson(
  data: OrgChartData,
  personId: string,
  options: { cascade?: boolean } = {},
): OrgChartData {
  findPerson(data, personId);
  const idsToRemove = new Set<string>([personId]);

  if (options.cascade) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const person of data.people) {
        if (idsToRemove.has(person.id)) continue;
        if (person.managerId !== undefined && idsToRemove.has(person.managerId)) {
          idsToRemove.add(person.id);
          changed = true;
        }
      }
    }
  }

  const people = data.people
    .filter((p) => !idsToRemove.has(p.id))
    .map((p) => ({
      ...p,
      managerId: p.managerId !== undefined && idsToRemove.has(p.managerId) ? undefined : p.managerId,
    }));

  const next: OrgChartData = {
    ...data,
    people,
    rootId: data.rootId && idsToRemove.has(data.rootId) ? undefined : data.rootId,
  };
  validateTreeData(next);
  return next;
}

export function addRelationship(data: OrgChartData, relationship: Relationship): OrgChartData {
  const { managerId, reportId } = relationship;
  const report = findPerson(data, reportId);
  findPerson(data, managerId);

  if (report.managerId === managerId) {
    return data;
  }
  if (report.managerId !== undefined) {
    throw new OrgChartError(
      `person "${reportId}" already has a manager; remove that relationship before adding another`,
    );
  }
  if (wouldCreateCycle(data, managerId, reportId)) {
    throw new OrgChartError(
      `Setting "${managerId}" as the manager of "${reportId}" would create a cycle in the management chain`,
    );
  }

  const next = withPerson(data, reportId, (p) => ({ ...p, managerId }));
  validateTreeData(next);
  return next;
}

export function removeRelationship(data: OrgChartData, relationship: Relationship): OrgChartData {
  const { managerId, reportId } = relationship;
  return withPerson(data, reportId, (p) =>
    p.managerId === managerId ? { ...p, managerId: undefined } : p,
  );
}
