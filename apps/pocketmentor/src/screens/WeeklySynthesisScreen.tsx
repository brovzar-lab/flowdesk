import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  DEMO_WEEKLY_SYNTHESIS,
  DEMO_WEEKLY_SYNTHESIS_LOCKED,
} from '../data/demoContent';
import { usePocketMentorStore } from '../lib/store';

export default function WeeklySynthesisScreen() {
  const navigation = useNavigation();
  const setPaywallVisible = usePocketMentorStore((s) => s.setPaywallVisible);
  const synthesis = DEMO_WEEKLY_SYNTHESIS;
  const lockedSynthesis = DEMO_WEEKLY_SYNTHESIS_LOCKED;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close weekly synthesis"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Synthesis</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionNote}>
          Each week, your arc is distilled into themes and a focus for the week ahead.
        </Text>

        {/* Unlocked week */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>WEEK 1</Text>
          <Text style={styles.cardWeekLabel}>{synthesis.weekLabel}</Text>

          <Text style={styles.themesLabel}>Themes this week</Text>
          <View style={styles.themesList}>
            {synthesis.themes.map((theme) => (
              <View key={theme} style={styles.themeTag}>
                <Text style={styles.themeText}>{theme}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.focusLabel}>Recommended focus</Text>
          <Text style={styles.focusText}>{synthesis.recommendedFocus}</Text>
        </View>

        {/* Locked week */}
        <TouchableOpacity
          style={[styles.card, styles.cardLocked]}
          onPress={() => setPaywallVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Unlock Week 2 synthesis with Premium"
        >
          <Text style={styles.cardEyebrow}>WEEK 2</Text>
          <Text style={styles.cardWeekLabel}>{lockedSynthesis.weekLabel}</Text>

          <Text style={styles.themesLabel}>Themes this week</Text>
          <View style={styles.themesList}>
            {lockedSynthesis.themes.map((theme, i) => (
              <View key={i} style={[styles.themeTag, styles.themeTagLocked]}>
                <Text style={[styles.themeText, styles.themeTextLocked]}>{theme}</Text>
              </View>
            ))}
          </View>

          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>Unlock with Premium</Text>
            <Text style={styles.lockSub}>$9.99/mo · cancel anytime</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 18, color: '#64748b' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 16,
  },
  sectionNote: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#161620',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  cardLocked: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardEyebrow: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardWeekLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  themesLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  themesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  themeTag: {
    backgroundColor: '#1e1a2d',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#3b2a5c',
  },
  themeTagLocked: {
    backgroundColor: '#1e1e2d',
    borderColor: '#2a2a3c',
  },
  themeText: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '600',
  },
  themeTextLocked: {
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e1e2d',
    marginBottom: 20,
  },
  focusLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  focusText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 23,
    fontStyle: 'italic',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 13, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockIcon: { fontSize: 28 },
  lockText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7c3aed',
  },
  lockSub: {
    fontSize: 12,
    color: '#475569',
  },
});
