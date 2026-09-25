export interface Employee {
  id: string;
  name: string;
  title?: string;
  department?: string;
  photoUrl?: string;
  /** The id of this employee's manager. Omit for a root (e.g. the CEO). */
  managerId?: string;
  /** Any valid CSS color. Tints this person's card (avatar, accent stripe, title, department
   * chip) and the connector line down to their own direct reports. Omit for the neutral
   * theme default. */
  color?: string;
  /** An emoji (or short glyph) shown in the department chip, e.g. '💻'. Only rendered
   * alongside `department` — has no effect on its own. */
  icon?: string;
  /** A short status label shown as a pill in the drawer, e.g. 'Active', 'On leave'. Omit to
   * hide the pill entirely. */
  status?: string;
  /** Any valid CSS color for the status pill. Defaults to a neutral green when `status` is
   * set but this isn't — has no effect without `status`. */
  statusColor?: string;
  /** Free-form data for consumer-defined fields, surfaced via DrawerField.key. */
  customFields?: Record<string, unknown>;
}

export interface OrgChartData {
  people: Employee[];
  /** Optional focal employee to root the layout at. Defaults to auto-detected roots. */
  rootId?: string;
}

export interface DrawerField {
  key: string;
  label: string;
  /** An emoji shown next to the label in the drawer's information list, e.g. '👤'. */
  icon?: string;
  render?: (person: Employee) => string;
}

export interface PositionedNode {
  id: string;
  personId: string;
  x: number;
  y: number;
}

export type EdgeKind = 'manager-report';

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutEdge {
  id: string;
  kind: EdgeKind;
  /** Baked pixel coordinates — this is a static, precomputed layout, so edges carry their own
   * endpoints rather than referencing node ids. `from` is the bottom-center of the manager's
   * box, `to` is the top-center of the report's box. */
  from: LayoutPoint;
  to: LayoutPoint;
  /** The report (child) employee's `color`, if they set one — lets each branch's connector
   * line match that branch's own color. Undefined when the report has no color set. */
  color?: string;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalGap?: number;
  verticalGap?: number;
}

export class OrgChartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrgChartError';
  }
}
