import React, { useEffect, useMemo, useState } from 'react';
import { computeLayout } from '../core/layout.js';
import { addPerson, addRelationship, removePerson, updatePerson } from '../core/mutations.js';
import type { DrawerField, Employee, LayoutOptions, OrgChartData } from '../core/types.js';
import { generateEmployeeId } from '../shared/generateId.js';
import { Connectors } from './Connectors.js';
import { Drawer } from './Drawer.js';
import type { RelationType } from './Drawer.js';
import { EmptyState } from './EmptyState.js';
import { PanZoomCanvas } from './PanZoomCanvas.js';
import { TreeNode } from './TreeNode.js';
import { defaultTheme, themeToCssVars } from './theme.js';
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
  style?: React.CSSProperties;
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
  style,
}: OrgChartProps) {
  const [pinnedPersonId, setPinnedPersonId] = useState<string | null>(null);
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);

  const peopleById = useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data.people]);
  const layout = useMemo(() => computeLayout(data, layoutOptions), [data, layoutOptions]);
  const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme]);
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

  const handleNodeClick = (person: Employee) => {
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
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style,
        ...(themeToCssVars(mergedTheme) as React.CSSProperties),
      }}
    >
      {data.people.length === 0 ? (
        <EmptyState editable={editable && !!onChange} onAddFirstPerson={handleAddFirstPerson} />
      ) : (
        <PanZoomCanvas contentWidth={layout.width} contentHeight={layout.height} minScale={minZoom} maxScale={maxZoom}>
          <div
            style={{ position: 'relative', width: layout.width, height: layout.height }}
            // Closes the drawer on a click that lands on empty canvas — checking that the event
            // target is this element itself (not a bubbled click from a node card) is what lets
            // the drawer close without a backdrop stealing clicks meant for other nodes.
            onClick={(e) => {
              if (e.target === e.currentTarget) handleDrawerClose();
            }}
          >
            <Connectors edges={layout.edges} width={layout.width} height={layout.height} />
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
                  onClick={handleNodeClick}
                  onHoverChange={handleNodeHover}
                  renderNodeContent={renderNodeContent}
                />
              );
            })}
          </div>
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
      />
    </div>
  );
}
