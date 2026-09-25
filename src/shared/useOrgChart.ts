import { useCallback, useState } from 'react';
import {
  addPerson,
  addRelationship,
  removePerson,
  removeRelationship,
  updatePerson,
} from '../core/mutations.js';
import type { Relationship } from '../core/mutations.js';
import type { Employee, OrgChartData } from '../core/types.js';

export interface UseOrgChartResult {
  data: OrgChartData;
  setData: (data: OrgChartData) => void;
  addPerson: (person: Employee) => void;
  removePerson: (personId: string, options?: { cascade?: boolean }) => void;
  updatePerson: (personId: string, updates: Partial<Omit<Employee, 'id'>>) => void;
  addRelationship: (relationship: Relationship) => void;
  removeRelationship: (relationship: Relationship) => void;
}

/**
 * Headless state container for consumers who want org chart state without
 * rendering any UI. Wraps the pure functions in core/mutations — useful for
 * building a custom UI, or managing data server-side/in tests.
 */
export function useOrgChart(initialData: OrgChartData): UseOrgChartResult {
  const [data, setData] = useState(initialData);

  return {
    data,
    setData,
    addPerson: useCallback((person: Employee) => setData((prev) => addPerson(prev, person)), []),
    removePerson: useCallback(
      (personId: string, options?: { cascade?: boolean }) =>
        setData((prev) => removePerson(prev, personId, options)),
      [],
    ),
    updatePerson: useCallback(
      (personId: string, updates: Partial<Omit<Employee, 'id'>>) =>
        setData((prev) => updatePerson(prev, personId, updates)),
      [],
    ),
    addRelationship: useCallback(
      (relationship: Relationship) => setData((prev) => addRelationship(prev, relationship)),
      [],
    ),
    removeRelationship: useCallback(
      (relationship: Relationship) => setData((prev) => removeRelationship(prev, relationship)),
      [],
    ),
  };
}
