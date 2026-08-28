import { View, Text, StyleSheet } from 'react-native';

export function DemoBanner() {
  return (
    <View style={styles.banner} accessibilityLabel="Demo mode active">
      <Text style={styles.text}>📱 Demo Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef9c3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  text: { fontSize: 12, color: '#854d0e', fontWeight: '600', letterSpacing: 0.3 },
});
