import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { defaultTheme } from './theme.js';
import type { OrgChartTheme } from './theme.js';

export interface EmptyStateProps {
  editable: boolean;
  onAddFirstPerson: (name: string) => void;
  theme?: OrgChartTheme;
}

export function EmptyState({ editable, onAddFirstPerson, theme = defaultTheme }: EmptyStateProps) {
  const [name, setName] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <Text style={styles.emoji}>🏢</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Start your org chart</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {editable ? 'Add the first person to begin.' : 'No one has been added to this chart yet.'}
        </Text>
        {editable && (
          <View style={styles.row}>
            <TextInput
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => name.trim() && onAddFirstPerson(name.trim())}
              placeholder="Full name"
              style={[styles.input, { borderColor: theme.cardBorder, color: theme.textPrimary }]}
            />
            <Pressable
              disabled={!name.trim()}
              onPress={() => name.trim() && onAddFirstPerson(name.trim())}
              style={[styles.button, { backgroundColor: theme.textPrimary, opacity: name.trim() ? 1 : 0.5 }]}
            >
              <Text style={styles.buttonText}>Add</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 32, maxWidth: 320, alignItems: 'center' },
  emoji: { fontSize: 32, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 6, width: '100%' },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  button: { borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
