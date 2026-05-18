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
    backgroundColor: '#1e1e2d',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3c',
  },
  text: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
