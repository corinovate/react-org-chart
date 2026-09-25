import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { LayoutEdge, LayoutPoint } from '../core/types.js';
import { defaultTheme } from './theme.js';
import type { OrgChartTheme } from './theme.js';

const CORNER_RADIUS = 10;

function elbowPath(from: LayoutPoint, to: LayoutPoint): string {
  if (Math.abs(from.x - to.x) < 0.5) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const midY = (from.y + to.y) / 2;
  const r = Math.min(CORNER_RADIUS, Math.abs(to.x - from.x) / 2, Math.abs(midY - from.y), Math.abs(to.y - midY));
  const sign = to.x > from.x ? 1 : -1;
  return [
    `M ${from.x} ${from.y}`,
    `L ${from.x} ${midY - r}`,
    `Q ${from.x} ${midY} ${from.x + sign * r} ${midY}`,
    `L ${to.x - sign * r} ${midY}`,
    `Q ${to.x} ${midY} ${to.x} ${midY + r}`,
    `L ${to.x} ${to.y}`,
  ].join(' ');
}

export interface ConnectorsProps {
  edges: LayoutEdge[];
  width: number;
  height: number;
  theme?: OrgChartTheme;
}

export function Connectors({ edges, width, height, theme = defaultTheme }: ConnectorsProps) {
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none"
    >
      {edges.map((edge) => (
        <Path
          key={edge.id}
          d={elbowPath(edge.from, edge.to)}
          fill="none"
          stroke={edge.color ?? theme.accentManagerReport}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
