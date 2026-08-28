import { View, Text, StyleSheet } from 'react-native';

export function DemoBanner() {
  return (
    <View style={styles.banner} accessibilityLabel="Demo mode active">
      <Text style={styles.text}>🎙️ Demo Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f5f3ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd6fe',
  },
  text: { fontSize: 12, color: '#6d28d9', fontWeight: '600', letterSpacing: 0.3 },
});
