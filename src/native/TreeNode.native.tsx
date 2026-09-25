import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Employee } from '../core/types.js';
import { defaultTheme } from './theme.js';
import type { OrgChartTheme } from './theme.js';

export interface TreeNodeProps {
  person: Employee;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  onPress: (person: Employee) => void;
  onHoverChange?: (person: Employee | null) => void;
  theme?: OrgChartTheme;
  renderNodeContent?: (
    person: Employee,
    state: { isSelected: boolean; isHovered: boolean },
  ) => React.ReactNode;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function TreeNode({
  person,
  x,
  y,
  width,
  height,
  isSelected,
  onPress,
  onHoverChange,
  theme = defaultTheme,
  renderNodeContent,
}: TreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Falls back to initials when photoUrl is set but fails to load (404, broken link, an
  // auth-gated URL Image can't fetch without headers) instead of leaving the avatar blank.
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [person.photoUrl]);

  // The Pressable (hit box: fixed position/size, owns press/hover handling) is a separate
  // element from the animated inner card — putting the hover transform on the same element
  // that listens for hover can shift its own hit-test bounds under a stationary pointer and
  // cause a hover on/off feedback loop (this bit the web renderer; same risk applies here
  // when rendered via react-native-web with a physical mouse).
  const handleHoverIn = () => {
    setIsHovered(true);
    onHoverChange?.(person);
  };
  const handleHoverOut = () => {
    setIsHovered(false);
    onHoverChange?.(null);
  };

  if (renderNodeContent) {
    return (
      <Pressable
        style={{ position: 'absolute', left: x, top: y, width, height }}
        onPress={() => onPress(person)}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
      >
        {renderNodeContent(person, { isSelected, isHovered })}
      </Pressable>
    );
  }

  // A person's own `color` (see types.ts) tints their card; unset falls back to the theme's
  // neutral accent so the widget still looks intentional with no color data at all.
  const accentColor = person.color ?? theme.accentManagerReport;

  return (
    <Pressable
      onPress={() => onPress(person)}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={{ position: 'absolute', left: x, top: y, width, height }}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isHovered ? theme.cardBackgroundHover : theme.cardBackground,
            borderColor: isSelected ? accentColor : theme.cardBorder,
            borderLeftColor: accentColor,
            // No transform on hover, deliberately — see TreeNode.tsx (web) for why: it can
            // create a self-sustaining hover on/off oscillation on platforms that render this
            // via react-native-web with a physical mouse.
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: accentColor }]}>
          {person.photoUrl && !imageFailed ? (
            <Image
              source={{ uri: person.photoUrl }}
              style={styles.avatarImage}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Text style={[styles.avatarText, { color: person.color ? '#fff' : theme.textSecondary }]}>
              {initials(person.name)}
            </Text>
          )}
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {person.name}
          </Text>
          {person.title && (
            <Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>
              {person.title}
            </Text>
          )}
          {person.department && (
            <View style={[styles.chip, { backgroundColor: theme.cardBorder }]}>
              {person.icon && <Text style={styles.chipIcon}>{person.icon}</Text>}
              <Text style={[styles.chipText, { color: theme.textSecondary }]} numberOfLines={1}>
                {person.department}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#141008',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 15, fontWeight: '600' },
  textColumn: { flexShrink: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '600' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipIcon: { fontSize: 11 },
  chipText: { fontSize: 11, fontWeight: '500' },
});
