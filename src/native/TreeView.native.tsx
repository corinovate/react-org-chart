import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { computeLayout } from '../core/layout.js';
import { addPerson, addRelationship, removePerson, updatePerson } from '../core/mutations.js';
import type { DrawerField, Employee, LayoutOptions, OrgChartData } from '../core/types.js';
import { generateEmployeeId } from '../shared/generateId.js';
import { Connectors } from './Connectors.native.js';
import { Drawer } from './Drawer.native.js';
import type { RelationType } from './Drawer.native.js';
import { EmptyState } from './EmptyState.native.js';
import { PanZoomCanvas } from './PanZoomCanvas.native.js';
import { TreeNode } from './TreeNode.native.js';
import { defaultTheme } from './theme.js';
import type { OrgChartTheme } from './theme.js';

export interface OrgChartProps {
  data: OrgChartData;
  onChange?: (data: OrgChartData) => void;
  editable?: boolean;
  printable?: boolean;
  drawerFields?: DrawerField[];
  renderNodeContent?: (
    person: Employee,
    state: { isSelected: boolean; isHovered: boolean },
  ) => React.ReactNode;
  onNodeClick?: (person: Employee) => void;
  onNodeHover?: (person: Employee | null) => void;
  theme?: Partial<OrgChartTheme>;
  layoutOptions?: LayoutOptions;
  minZoom?: number;
  maxZoom?: number;
}

export function OrgChart({
  data,
  onChange,
  editable = false,
  printable = true,
  drawerFields,
  renderNodeContent,
  onNodeClick,
  onNodeHover,
  theme,
  layoutOptions,
  minZoom,
  maxZoom,
}: OrgChartProps) {
  const [pinnedPersonId, setPinnedPersonId] = useState<string | null>(null);
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);

  const peopleById = useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data.people]);
  const layout = useMemo(() => computeLayout(data, layoutOptions), [data, layoutOptions]);
  const mergedTheme = useMemo<OrgChartTheme>(() => ({ ...defaultTheme, ...theme }), [theme]);
  const nodeWidth = layoutOptions?.nodeWidth ?? 220;
  const nodeHeight = layoutOptions?.nodeHeight ?? 112;

  // A consumer can legally remove the person currently shown in the drawer —
  // drop a selection that no longer exists rather than showing stale data.
  useEffect(() => {
    if (pinnedPersonId && !peopleById.has(pinnedPersonId)) setPinnedPersonId(null);
    if (hoveredPersonId && !peopleById.has(hoveredPersonId)) setHoveredPersonId(null);
  }, [peopleById, pinnedPersonId, hoveredPersonId]);

  const displayedPerson =
    (hoveredPersonId && peopleById.get(hoveredPersonId)) ||
    (pinnedPersonId && peopleById.get(pinnedPersonId)) ||
    null;

  const handleNodePress = (person: Employee) => {
    setPinnedPersonId(person.id);
    onNodeClick?.(person);
  };
  const handleNodeHover = (person: Employee | null) => {
    setHoveredPersonId(person?.id ?? null);
    onNodeHover?.(person);
  };
  const handleDrawerClose = () => setPinnedPersonId(null);

  const handleRemove = (personId: string) => {
    if (!onChange) return;
    onChange(removePerson(data, personId));
    setPinnedPersonId(null);
  };

  const handleAddRelation = (type: RelationType, name: string) => {
    if (!onChange || !displayedPerson) return;
    // Inherit color/icon/department from the related person rather than defaulting to the
    // neutral theme color — a new hire under a colored branch should visually join that
    // branch immediately, not show up gray until someone edits the data by hand.
    const newPerson: Employee = {
      id: generateEmployeeId(),
      name,
      color: displayedPerson.color,
      icon: displayedPerson.icon,
      department: displayedPerson.department,
    };
    let next = addPerson(data, newPerson);
    if (type === 'report') {
      next = addRelationship(next, { type: 'manager-report', managerId: displayedPerson.id, reportId: newPerson.id });
    } else {
      next = addRelationship(next, { type: 'manager-report', managerId: newPerson.id, reportId: displayedPerson.id });
    }
    onChange(next);
  };

  const handleEditPerson = (updates: { color?: string; icon?: string }) => {
    if (!onChange || !displayedPerson) return;
    onChange(updatePerson(data, displayedPerson.id, updates));
  };

  const handleAddFirstPerson = (name: string) => {
    if (!onChange) return;
    onChange(addPerson(data, { id: generateEmployeeId(), name }));
  };

  const canSetManager = displayedPerson?.managerId === undefined;
  const manager = displayedPerson?.managerId ? peopleById.get(displayedPerson.managerId) : undefined;

  return (
    <View style={[styles.container, { backgroundColor: mergedTheme.background }]}>
      {data.people.length === 0 ? (
        <EmptyState editable={editable && !!onChange} onAddFirstPerson={handleAddFirstPerson} theme={mergedTheme} />
      ) : (
        <PanZoomCanvas
          contentWidth={layout.width}
          contentHeight={layout.height}
          minScale={minZoom}
          maxScale={maxZoom}
        >
          <View style={{ width: layout.width, height: layout.height }}>
            <Connectors edges={layout.edges} width={layout.width} height={layout.height} theme={mergedTheme} />
            {layout.nodes.map((node) => {
              const person = peopleById.get(node.personId);
              if (!person) return null;
              return (
                <TreeNode
                  key={node.id}
                  person={person}
                  x={node.x}
                  y={node.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  isSelected={pinnedPersonId === person.id}
                  onPress={handleNodePress}
                  onHoverChange={handleNodeHover}
                  theme={mergedTheme}
                  renderNodeContent={renderNodeContent}
                />
              );
            })}
          </View>
        </PanZoomCanvas>
      )}
      <Drawer
        person={displayedPerson}
        manager={manager}
        isOpen={displayedPerson !== null}
        onClose={handleDrawerClose}
        fields={drawerFields}
        printable={printable}
        editable={editable}
        onRemove={editable && onChange ? handleRemove : undefined}
        onAddRelation={editable && onChange ? handleAddRelation : undefined}
        onEditPerson={editable && onChange ? handleEditPerson : undefined}
        canSetManager={canSetManager}
        theme={mergedTheme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
