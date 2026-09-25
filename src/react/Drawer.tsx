import React, { useEffect, useState } from 'react';
import type { DrawerField, Employee } from '../core/types.js';
import { printEmployeeWeb } from './print-web.js';

export type RelationType = 'report' | 'manager';
type ActionKind = RelationType | 'color' | 'icon';

export interface DrawerProps {
  person: Employee | null;
  /** The looked-up manager (via person.managerId), if any — drives the "Reports To" row.
   * Pass `undefined`/`null` to omit that row entirely. */
  manager?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  fields?: DrawerField[];
  printable?: boolean;
  editable?: boolean;
  onRemove?: (personId: string) => void;
  onAddRelation?: (type: RelationType, name: string) => void;
  /** Updates the selected person's own color/icon — powers the "Edit color"/"Edit icon"
   * actions. Omit to hide those two actions (they don't add/remove anyone, just restyle). */
  onEditPerson?: (updates: { color?: string; icon?: string }) => void;
  canSetManager?: boolean;
}

function fieldValue(person: Employee, field: DrawerField): string {
  if (field.render) return field.render(person);
  const value =
    (person as unknown as Record<string, unknown>)[field.key] ?? person.customFields?.[field.key];
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

const DEFAULT_FIELDS: DrawerField[] = [
  { key: 'title', label: 'Title', icon: '👤' },
  { key: 'department', label: 'Department', icon: '🏢' },
];

const DEFAULT_STATUS_COLOR = '#16a34a';

const COLOR_PALETTE = [
  '#7c5cff',
  '#6366f1',
  '#3b82f6',
  '#0d9488',
  '#16a34a',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#64748b',
];

const ICON_PALETTE = ['💻', '📊', '📈', '👥', '🎨', '⚙️', '📢', '💰', '🏥', '⚖️', '🔬', '📦'];

const RELATION_META: Record<RelationType, { label: string; description: (name: string) => string; icon: string }> = {
  report: {
    label: 'Add direct report',
    description: (name) => `Create a new position under ${name}`,
    icon: '➕',
  },
  manager: {
    label: 'Set manager',
    description: () => 'Change reporting structure',
    icon: '👑',
  },
};

function sectionLabelStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--oc-text-secondary)',
    marginBottom: 8,
  };
}

function ActionRow({
  icon,
  label,
  description,
  active,
  disabled,
  accentColor,
  onClick,
}: {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  disabled?: boolean;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 14px',
        borderRadius: 10,
        border: `1px solid ${active ? accentColor : 'var(--oc-card-border)'}`,
        background: 'var(--oc-card-bg-hover)',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          flexShrink: 0,
          background: `color-mix(in srgb, ${accentColor} 16%, var(--oc-card-bg-hover))`,
          fontSize: 15,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--oc-text-primary)' }}>{label}</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--oc-text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </div>
      </span>
      <span style={{ color: 'var(--oc-text-secondary)', fontSize: 16, flexShrink: 0 }}>›</span>
    </button>
  );
}

function customInputRowStyle(): React.CSSProperties {
  return {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--oc-card-border)',
    fontSize: 13,
    fontFamily: 'inherit',
  };
}

function ColorPickerPanel({ value, accentColor, onPick }: { value?: string; accentColor: string; onPick: (color: string) => void }) {
  const [custom, setCustom] = useState('');
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {COLOR_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onPick(swatch)}
            aria-label={swatch}
            title={swatch}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: swatch,
              cursor: 'pointer',
              border: value === swatch ? '2px solid var(--oc-text-primary)' : '2px solid transparent',
              boxShadow: '0 0 0 1px var(--oc-card-border)',
              padding: 0,
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && custom.trim() && onPick(custom.trim())}
          placeholder="Custom, e.g. #7c5cff"
          style={customInputRowStyle()}
        />
        <button
          type="button"
          onClick={() => custom.trim() && onPick(custom.trim())}
          disabled={!custom.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: accentColor,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: custom.trim() ? 'pointer' : 'not-allowed',
            opacity: custom.trim() ? 1 : 0.5,
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function IconPickerPanel({ value, accentColor, onPick }: { value?: string; accentColor: string; onPick: (icon: string) => void }) {
  const [custom, setCustom] = useState('');
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ICON_PALETTE.map((glyph) => (
          <button
            key={glyph}
            type="button"
            onClick={() => onPick(glyph)}
            style={{
              width: 32,
              height: 32,
              fontSize: 15,
              borderRadius: 8,
              border: `1.5px solid ${value === glyph ? accentColor : 'var(--oc-card-border)'}`,
              background: 'var(--oc-card-bg-hover)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {glyph}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && custom.trim() && onPick(custom.trim())}
          placeholder="Custom emoji"
          style={customInputRowStyle()}
        />
        <button
          type="button"
          onClick={() => custom.trim() && onPick(custom.trim())}
          disabled={!custom.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: accentColor,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: custom.trim() ? 'pointer' : 'not-allowed',
            opacity: custom.trim() ? 1 : 0.5,
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export function Drawer({
  person,
  manager,
  isOpen,
  onClose,
  fields = DEFAULT_FIELDS,
  printable = true,
  editable = false,
  onRemove,
  onAddRelation,
  onEditPerson,
  canSetManager = true,
}: DrawerProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [newName, setNewName] = useState('');
  // Falls back to initials when photoUrl is set but fails to load (404, broken link, an
  // auth-gated URL a plain <img> can't fetch) — otherwise the browser renders its broken-image
  // icon in place of the avatar.
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setConfirmingRemove(false);
    setActiveAction(null);
    setNewName('');
    setImageFailed(false);
  }, [person?.id, person?.photoUrl]);

  const submitAdd = () => {
    if ((activeAction !== 'report' && activeAction !== 'manager') || !newName.trim() || !onAddRelation) return;
    onAddRelation(activeAction, newName.trim());
    setActiveAction(null);
    setNewName('');
  };

  // A person's own `color` carries through to the drawer so it visually matches their card;
  // unset falls back to the same neutral theme accent TreeNode uses.
  const accentColor = person?.color ?? 'var(--oc-accent-manager-report)';
  const statusColor = person?.statusColor ?? DEFAULT_STATUS_COLOR;

  return (
    <>
      {/* Deliberately no full-screen backdrop: this is a persistent inspector panel, not a modal
          — a click-catching overlay over the canvas would swallow clicks meant for other nodes,
          forcing a click-to-close-then-click-again to switch selection. Closing on an
          away-from-the-panel click is instead handled by the canvas background itself
          (TreeView's onClick), which only fires for clicks that don't land on a node. */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
          maxWidth: '90vw',
          background: 'var(--oc-drawer-bg)',
          boxShadow: '-8px 0 24px rgba(20,16,8,0.12)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 21,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--oc-font-family)',
        }}
      >
        {person && (
          <>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--oc-card-border)' }}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  float: 'right',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: 'var(--oc-text-secondary)',
                }}
              >
                ×
              </button>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: accentColor,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
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
                  person.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? '')
                    .join('')
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--oc-text-primary)' }}>
                {person.name}
              </h2>
              {person.title && (
                <div style={{ marginTop: 2, fontSize: 14, fontWeight: 600, color: accentColor }}>{person.title}</div>
              )}
              {person.status && (
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: `color-mix(in srgb, ${statusColor} 18%, var(--oc-card-bg-hover))`,
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {person.status}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={sectionLabelStyle()}>Information</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.key} style={{ borderBottom: '1px solid var(--oc-card-border)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 0',
                          color: 'var(--oc-text-secondary)',
                          fontWeight: 500,
                          width: '46%',
                        }}
                      >
                        {field.icon && <span style={{ marginRight: 6 }}>{field.icon}</span>}
                        {field.label}
                      </th>
                      <td style={{ padding: '10px 0', color: 'var(--oc-text-primary)', textAlign: 'right' }}>
                        {fieldValue(person, field)}
                      </td>
                    </tr>
                  ))}
                  {manager && (
                    <tr style={{ borderBottom: '1px solid var(--oc-card-border)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 0',
                          color: 'var(--oc-text-secondary)',
                          fontWeight: 500,
                          width: '46%',
                        }}
                      >
                        <span style={{ marginRight: 6 }}>🧭</span>
                        Reports To
                      </th>
                      <td style={{ padding: '10px 0', color: 'var(--oc-text-primary)', textAlign: 'right' }}>
                        {manager.name}
                        {manager.title ? ` (${manager.title})` : ''}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {editable && (onAddRelation || onEditPerson) && (
                <div style={{ marginTop: 24 }}>
                  <div style={sectionLabelStyle()}>Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {onAddRelation &&
                      (['report', 'manager'] as RelationType[]).map((type) => {
                        const meta = RELATION_META[type];
                        return (
                          <ActionRow
                            key={type}
                            icon={meta.icon}
                            label={meta.label}
                            description={meta.description(person.name)}
                            active={activeAction === type}
                            disabled={type === 'manager' && !canSetManager}
                            accentColor={accentColor}
                            onClick={() => {
                              setActiveAction(activeAction === type ? null : type);
                              setNewName('');
                            }}
                          />
                        );
                      })}
                    {onEditPerson && (
                      <>
                        <ActionRow
                          icon="🎨"
                          label="Edit color"
                          description={`Change ${person.name}'s card and line color`}
                          active={activeAction === 'color'}
                          accentColor={accentColor}
                          onClick={() => setActiveAction(activeAction === 'color' ? null : 'color')}
                        />
                        <ActionRow
                          icon="✨"
                          label="Edit icon"
                          description="Change the department chip icon"
                          active={activeAction === 'icon'}
                          accentColor={accentColor}
                          onClick={() => setActiveAction(activeAction === 'icon' ? null : 'icon')}
                        />
                      </>
                    )}
                  </div>

                  {(activeAction === 'report' || activeAction === 'manager') && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                      <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                        placeholder="Full name"
                        style={customInputRowStyle()}
                      />
                      <button
                        type="button"
                        onClick={submitAdd}
                        disabled={!newName.trim()}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: accentColor,
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: newName.trim() ? 'pointer' : 'not-allowed',
                          opacity: newName.trim() ? 1 : 0.5,
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {activeAction === 'color' && onEditPerson && (
                    <ColorPickerPanel
                      value={person.color}
                      accentColor={accentColor}
                      onPick={(color) => {
                        onEditPerson({ color });
                        setActiveAction(null);
                      }}
                    />
                  )}

                  {activeAction === 'icon' && onEditPerson && (
                    <IconPickerPanel
                      value={person.icon}
                      accentColor={accentColor}
                      onPick={(icon) => {
                        onEditPerson({ icon });
                        setActiveAction(null);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--oc-card-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {printable && (
                <button
                  type="button"
                  onClick={() => printEmployeeWeb(person, fields)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: accentColor,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true">🖨️</span>
                  Print
                </button>
              )}
              {editable && onRemove && !confirmingRemove && (
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e0b4a8',
                    background: 'transparent',
                    color: '#b0402b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true">🗑️</span>
                  Remove
                </button>
              )}
              {editable && onRemove && confirmingRemove && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--oc-text-secondary)' }}>Remove {person.name}?</span>
                  <button
                    type="button"
                    onClick={() => onRemove(person.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#b0402b',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingRemove(false)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--oc-card-border)',
                      background: 'transparent',
                      color: 'var(--oc-text-primary)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
