import { View, Text, StyleSheet } from 'react-native';
import type { AllergenStatus } from '../lib/types';

interface Props {
  status: AllergenStatus;
}

const STATUS_CONFIG: Record<AllergenStatus, { emoji: string; label: string; bg: string; text: string }> = {
  safe: { emoji: '🟢', label: 'Safe', bg: '#dcfce7', text: '#166534' },
  warning: { emoji: '🟡', label: 'Check', bg: '#fef3c7', text: '#92400e' },
  danger: { emoji: '🔴', label: 'Avoid', bg: '#fee2e2', text: '#991b1b' },
};

export function TrafficLightBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }]}
      accessibilityLabel={`Allergen status: ${config.label}`}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 64,
    minHeight: 52,
  },
  emoji: { fontSize: 18 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },
});
