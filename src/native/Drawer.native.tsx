import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { DrawerField, Employee } from '../core/types.js';
import { printEmployeeNative } from './print-native.js';
import { defaultTheme } from './theme.js';
import type { OrgChartTheme } from './theme.js';

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
  theme?: OrgChartTheme;
  width?: number;
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

function fieldValue(person: Employee, field: DrawerField): string {
  if (field.render) return field.render(person);
  const value =
    (person as unknown as Record<string, unknown>)[field.key] ?? person.customFields?.[field.key];
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function ActionRow({
  icon,
  label,
  description,
  active,
  disabled,
  theme,
  onPress,
}: {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  disabled?: boolean;
  theme: OrgChartTheme;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionRow, { borderColor: active ? theme.cardBorderSelected : theme.cardBorder, opacity: disabled ? 0.4 : 1 }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.cardBorder }]}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary }} numberOfLines={1}>
          {description}
        </Text>
      </View>
      <Text style={{ fontSize: 16, color: theme.textSecondary }}>›</Text>
    </Pressable>
  );
}

function ColorPickerPanel({
  value,
  accentColor,
  theme,
  onPick,
}: {
  value?: string;
  accentColor: string;
  theme: OrgChartTheme;
  onPick: (color: string) => void;
}) {
  const [custom, setCustom] = useState('');
  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.swatchRow}>
        {COLOR_PALETTE.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => onPick(swatch)}
            style={[
              styles.swatch,
              { backgroundColor: swatch, borderColor: value === swatch ? theme.textPrimary : 'transparent' },
            ]}
          />
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={() => custom.trim() && onPick(custom.trim())}
          placeholder="Custom, e.g. #7c5cff"
          style={[styles.input, { borderColor: theme.cardBorder, color: theme.textPrimary }]}
        />
        <Pressable
          disabled={!custom.trim()}
          onPress={() => custom.trim() && onPick(custom.trim())}
          style={[styles.addButton, { backgroundColor: accentColor, opacity: custom.trim() ? 1 : 0.5 }]}
        >
          <Text style={styles.buttonText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

function IconPickerPanel({
  value,
  accentColor,
  theme,
  onPick,
}: {
  value?: string;
  accentColor: string;
  theme: OrgChartTheme;
  onPick: (icon: string) => void;
}) {
  const [custom, setCustom] = useState('');
  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.swatchRow}>
        {ICON_PALETTE.map((glyph) => (
          <Pressable
            key={glyph}
            onPress={() => onPick(glyph)}
            style={[
              styles.iconSwatch,
              { borderColor: value === glyph ? accentColor : theme.cardBorder, backgroundColor: theme.cardBackgroundHover },
            ]}
          >
            <Text style={{ fontSize: 15 }}>{glyph}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={() => custom.trim() && onPick(custom.trim())}
          placeholder="Custom emoji"
          style={[styles.input, { borderColor: theme.cardBorder, color: theme.textPrimary }]}
        />
        <Pressable
          disabled={!custom.trim()}
          onPress={() => custom.trim() && onPick(custom.trim())}
          style={[styles.addButton, { backgroundColor: accentColor, opacity: custom.trim() ? 1 : 0.5 }]}
        >
          <Text style={styles.buttonText}>Apply</Text>
        </Pressable>
      </View>
    </View>
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
  theme = defaultTheme,
  width = 340,
}: DrawerProps) {
  const translateX = useSharedValue(width);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [newName, setNewName] = useState('');
  // Falls back to initials when photoUrl is set but fails to load (404, broken link, an
  // auth-gated URL Image can't fetch without headers) instead of leaving the avatar blank.
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    translateX.value = withTiming(isOpen ? 0 : width, { duration: 240 });
  }, [isOpen, width, translateX]);

  useEffect(() => {
    setConfirmingRemove(false);
    setActiveAction(null);
    setNewName('');
    setImageFailed(false);
  }, [person?.id, person?.photoUrl]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const submitAdd = () => {
    if ((activeAction !== 'report' && activeAction !== 'manager') || !newName.trim() || !onAddRelation) return;
    onAddRelation(activeAction, newName.trim());
    setActiveAction(null);
    setNewName('');
  };

  // A person's own `color` carries through to the drawer so it visually matches their card;
  // unset falls back to the same neutral theme accent TreeNode uses.
  const accentColor = person?.color ?? theme.accentManagerReport;
  const statusColor = person?.statusColor ?? DEFAULT_STATUS_COLOR;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.panel, { width, backgroundColor: theme.drawerBackground }, animatedStyle]}>
        {person && (
          <>
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={{ fontSize: 20, color: theme.textSecondary }}>×</Text>
              </Pressable>
              <View style={[styles.avatar, { backgroundColor: accentColor }]}>
                {person.photoUrl && !imageFailed ? (
                  <Image
                    source={{ uri: person.photoUrl }}
                    style={{ width: '100%', height: '100%' }}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: person.color ? '#fff' : theme.textSecondary }]}>
                    {person.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? '')
                      .join('')}
                  </Text>
                )}
              </View>
              <Text style={[styles.name, { color: theme.textPrimary }]}>{person.name}</Text>
              {person.title && <Text style={[styles.title, { color: accentColor }]}>{person.title}</Text>}
              {person.status && (
                <View style={[styles.statusPill, { backgroundColor: theme.cardBorder }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{person.status}</Text>
                </View>
              )}
            </View>

            <ScrollView style={styles.body}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>INFORMATION</Text>
              {fields.map((field) => (
                <View key={field.key} style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
                  <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                    {field.icon ? `${field.icon}  ` : ''}
                    {field.label}
                  </Text>
                  <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{fieldValue(person, field)}</Text>
                </View>
              ))}
              {manager && (
                <View style={[styles.row, { borderBottomColor: theme.cardBorder }]}>
                  <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>🧭  Reports To</Text>
                  <Text style={[styles.rowValue, { color: theme.textPrimary }]}>
                    {manager.name}
                    {manager.title ? ` (${manager.title})` : ''}
                  </Text>
                </View>
              )}

              {editable && (onAddRelation || onEditPerson) && (
                <View style={{ marginTop: 24 }}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ACTIONS</Text>
                  <View style={{ gap: 8 }}>
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
                            theme={theme}
                            onPress={() => {
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
                          theme={theme}
                          onPress={() => setActiveAction(activeAction === 'color' ? null : 'color')}
                        />
                        <ActionRow
                          icon="✨"
                          label="Edit icon"
                          description="Change the department chip icon"
                          active={activeAction === 'icon'}
                          theme={theme}
                          onPress={() => setActiveAction(activeAction === 'icon' ? null : 'icon')}
                        />
                      </>
                    )}
                  </View>

                  {(activeAction === 'report' || activeAction === 'manager') && (
                    <View style={styles.addRow}>
                      <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        onSubmitEditing={submitAdd}
                        placeholder="Full name"
                        style={[styles.input, { borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      />
                      <Pressable
                        disabled={!newName.trim()}
                        onPress={submitAdd}
                        style={[styles.addButton, { backgroundColor: accentColor, opacity: newName.trim() ? 1 : 0.5 }]}
                      >
                        <Text style={styles.buttonText}>Add</Text>
                      </Pressable>
                    </View>
                  )}

                  {activeAction === 'color' && onEditPerson && (
                    <ColorPickerPanel
                      value={person.color}
                      accentColor={accentColor}
                      theme={theme}
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
                      theme={theme}
                      onPick={(icon) => {
                        onEditPerson({ icon });
                        setActiveAction(null);
                      }}
                    />
                  )}
                </View>
              )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
              {printable && (
                <Pressable
                  style={[styles.button, { backgroundColor: accentColor }]}
                  onPress={() => {
                    printEmployeeNative(person, fields).catch(() => {
                      /* user cancelled the native print/share sheet, or printing is unsupported on this device */
                    });
                  }}
                >
                  <Text style={styles.buttonText}>🖨️  Print</Text>
                </Pressable>
              )}
              {editable && onRemove && !confirmingRemove && (
                <Pressable style={styles.removeButton} onPress={() => setConfirmingRemove(true)}>
                  <Text style={styles.removeButtonText}>🗑️  Remove</Text>
                </Pressable>
              )}
              {editable && onRemove && confirmingRemove && (
                <View style={styles.confirmRow}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Remove {person.name}?</Text>
                  <Pressable style={styles.confirmButton} onPress={() => onRemove(person.id)}>
                    <Text style={styles.buttonText}>Confirm</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
                    onPress={() => setConfirmingRemove(false)}
                  >
                    <Text style={{ fontSize: 13, color: theme.textPrimary }}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,16,8,0.15)' },
  panel: { position: 'absolute', top: 0, right: 0, bottom: 0 },
  header: { padding: 24, paddingBottom: 16, borderBottomWidth: 1 },
  closeButton: { position: 'absolute', top: 20, right: 20, padding: 4 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  statusPill: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '600' },
  body: { flex: 1, padding: 24, paddingTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1 },
  rowLabel: { width: '46%', fontSize: 13 },
  rowValue: { flex: 1, fontSize: 13, textAlign: 'right' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  iconSwatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  addButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  footer: { gap: 8, padding: 24, paddingTop: 16, borderTopWidth: 1 },
  button: { flexDirection: 'row', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  removeButton: {
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0b4a8',
  },
  removeButtonText: { color: '#b0402b', fontSize: 13, fontWeight: '600' },
  confirmRow: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  confirmButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#b0402b' },
  cancelButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1 },
});
