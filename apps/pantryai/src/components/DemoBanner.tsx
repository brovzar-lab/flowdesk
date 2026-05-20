import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DemoBanner() {
  return (
    <View style={styles.banner} accessibilityLabel="Demo mode active">
      <Text style={styles.text}>✦ Demo Mode — no backend required</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#0f1a0f',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2d1a',
  },
  text: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
