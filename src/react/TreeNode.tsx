import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Employee } from '../core/types.js';

export interface TreeNodeProps {
  person: Employee;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  onClick: (person: Employee) => void;
  onHoverChange: (person: Employee | null) => void;
  renderNodeContent?: (person: Employee, state: { isSelected: boolean; isHovered: boolean }) => React.ReactNode;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

// The hit box (this element: fixed position/size, listens for hover/click, excluded from
// panning) is deliberately a separate element from the animated visual card inside it. Hover
// transforms (lift + scale) must never be applied to the same element that owns the
// mouseenter/mouseleave listeners — doing so shifts that element's own hit-test boundary right
// under a stationary cursor, which can flip hover on/off dozens of times a second and makes
// clicks land unpredictably. The inner card is free to animate however it likes.
const hitBoxStyle = (x: number, y: number, width: number, height: number): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width,
  height,
  cursor: 'pointer',
});

export function TreeNode({
  person,
  x,
  y,
  width,
  height,
  isSelected,
  onClick,
  onHoverChange,
  renderNodeContent,
}: TreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Falls back to initials when photoUrl is set but fails to load (404, broken link, an
  // auth-gated URL a plain <img> can't fetch) — otherwise the browser renders its broken-image
  // icon in place of the avatar. Reset whenever the URL itself changes, not just on mount.
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [person.photoUrl]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange(person);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange(null);
  };

  const sharedProps = {
    className: 'oc-node-card',
    onClick: () => onClick(person),
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && onClick(person),
  };

  if (renderNodeContent) {
    return (
      <div style={hitBoxStyle(x, y, width, height)} {...sharedProps}>
        {renderNodeContent(person, { isSelected, isHovered })}
      </div>
    );
  }

  // A person's own `color` (see types.ts) tints their card; unset falls back to the theme's
  // neutral accent so the widget still looks intentional with no color data at all.
  const accentColor = person.color ?? 'var(--oc-accent-manager-report)';

  const cardStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    // No transform here, deliberately: animating transform/scale on hover shifts this element's
    // own painted geometry under a stationary cursor, which can make the browser re-evaluate
    // hover boundaries mid-transition and re-trigger the same transition — a self-sustaining
    // mouseenter/mouseleave oscillation that intermittently swallows the click. box-shadow and
    // outline never move a pixel, so they're safe to animate here.
    transition: 'box-shadow 160ms ease, outline-color 160ms ease',
    background: 'var(--oc-card-bg)',
    border: '1px solid var(--oc-card-border)',
    borderLeft: `5px solid ${accentColor}`,
    borderRadius: 14,
    boxShadow: isHovered ? '0 4px 10px rgba(20,16,8,0.06), 0 10px 24px rgba(20,16,8,0.12)' : 'var(--oc-card-shadow)',
    // outline (not border-color) carries the selection ring: the accent stripe already owns
    // border-left, and outline draws outside the box without disturbing card layout/sizing.
    outline: isSelected ? `2px solid ${accentColor}` : '2px solid transparent',
    outlineOffset: 2,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    boxSizing: 'border-box',
    fontFamily: 'var(--oc-font-family)',
  };

  return (
    <div style={hitBoxStyle(x, y, width, height)} aria-pressed={isSelected} {...sharedProps}>
      <div style={cardStyle}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            flexShrink: 0,
            overflow: 'hidden',
            background: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 600,
            color: person.color ? '#fff' : 'var(--oc-text-secondary)',
          }}
        >
          {person.photoUrl && !imageFailed ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              onError={() => setImageFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials(person.name)
          )}
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--oc-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {person.name}
          </div>
          {person.title && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: accentColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {person.title}
            </div>
          )}
          {person.department && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
                padding: '2px 8px',
                borderRadius: 999,
                background: `color-mix(in srgb, ${accentColor} 16%, var(--oc-card-bg-hover))`,
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--oc-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {person.icon && <span aria-hidden="true">{person.icon}</span>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.department}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
