import { hierarchy, tree as d3tree } from 'd3-hierarchy';
import type { LayoutEdge, LayoutOptions, LayoutResult, OrgChartData, PositionedNode } from './types.js';

/**
 * Layout pipeline: an org chart is a strict tree (each employee has at most one manager), so
 * this is a direct application of d3-hierarchy's tidy-tree algorithm over the reporting chain —
 * no DAG-merge/duplicate handling needed, unlike a genealogy tree with shared ancestors.
 * Multiple roots (e.g. several people with no manager) are laid out as separate trees and
 * stitched side by side.
 */

interface HierarchyDatum {
  id: string;
  children: HierarchyDatum[];
}

const DEFAULTS: Required<LayoutOptions> = {
  nodeWidth: 220,
  nodeHeight: 112,
  horizontalGap: 32,
  verticalGap: 96,
};

function buildForest(data: OrgChartData): HierarchyDatum[] {
  const ids = new Set(data.people.map((p) => p.id));
  const reportsByManager = new Map<string, string[]>();
  for (const person of data.people) {
    if (person.managerId === undefined || !ids.has(person.managerId)) continue;
    const list = reportsByManager.get(person.managerId) ?? [];
    list.push(person.id);
    reportsByManager.set(person.managerId, list);
  }

  function build(id: string): HierarchyDatum {
    return { id, children: (reportsByManager.get(id) ?? []).map(build) };
  }

  return data.people
    .filter((p) => p.managerId === undefined || !ids.has(p.managerId))
    .map((p) => build(p.id));
}

export function computeLayout(data: OrgChartData, options: LayoutOptions = {}): LayoutResult {
  const opts = { ...DEFAULTS, ...options };
  const forest = buildForest(data);
  const colorById = new Map(data.people.map((p) => [p.id, p.color]));

  const nodes: PositionedNode[] = [];
  const edges: LayoutEdge[] = [];

  let maxX = 0;
  let maxY = 0;
  let xOffset = 0;

  forest.forEach((root) => {
    const h = hierarchy<HierarchyDatum>(root, (d) => d.children);
    const layoutTree = d3tree<HierarchyDatum>().nodeSize([
      opts.nodeWidth + opts.horizontalGap,
      opts.nodeHeight + opts.verticalGap,
    ]);
    layoutTree(h);

    let localMinX = Infinity;
    h.each((node) => {
      localMinX = Math.min(localMinX, node.x ?? 0);
    });
    const shift = xOffset - (Number.isFinite(localMinX) ? localMinX : 0) + opts.nodeWidth / 2;

    const centerById = new Map<string, { x: number; y: number }>();

    h.each((node) => {
      const centerX = (node.x ?? 0) + shift;
      const y = node.y ?? 0;
      const x = centerX - opts.nodeWidth / 2;
      maxX = Math.max(maxX, x + opts.nodeWidth);
      maxY = Math.max(maxY, y + opts.nodeHeight);
      nodes.push({ id: node.data.id, personId: node.data.id, x, y });
      centerById.set(node.data.id, { x: centerX, y });
    });

    h.each((node) => {
      if (!node.parent) return;
      const from = centerById.get(node.parent.data.id)!;
      const to = centerById.get(node.data.id)!;
      edges.push({
        id: `mr:${node.parent.data.id}->${node.data.id}`,
        kind: 'manager-report',
        from: { x: from.x, y: from.y + opts.nodeHeight },
        to: { x: to.x, y: to.y },
        color: colorById.get(node.data.id),
      });
    });

    xOffset = maxX + opts.horizontalGap * 3;
  });

  return {
    nodes,
    edges,
    width: Math.max(xOffset, maxX, 0),
    height: maxY + opts.nodeHeight,
  };
}
