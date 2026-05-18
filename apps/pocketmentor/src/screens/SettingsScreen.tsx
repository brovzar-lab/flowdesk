import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { usePocketMentorStore } from '../lib/store';
import { CAREER_STAGE_LABELS } from '../data/demoContent';
import type { CareerStage } from '../lib/types';
import { isDemoMode } from '../lib/demo';
import { DemoBanner } from '../components/DemoBanner';

const NOTIFICATION_TIMES = ['07:00', '08:00', '09:00', '12:00', '18:00', '21:00'];

export default function SettingsScreen() {
  const careerStage = usePocketMentorStore((s) => s.careerStage);
  const setCareerStage = usePocketMentorStore((s) => s.setCareerStage);
  const setHasCompletedOnboarding = usePocketMentorStore((s) => s.setHasCompletedOnboarding);
  const isPremium = usePocketMentorStore((s) => s.isPremium);
  const setPaywallVisible = usePocketMentorStore((s) => s.setPaywallVisible);
  const notificationTime = usePocketMentorStore((s) => s.notificationTime);
  const setNotificationTime = usePocketMentorStore((s) => s.setNotificationTime);

  const stages: CareerStage[] = ['starting_out', 'in_the_grind', 'making_a_move'];

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          {isPremium ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Plan</Text>
              <Text style={styles.rowValueAccent}>Premium ✓</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeRow}
              onPress={() => setPaywallVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Upgrade to Premium"
            >
              <View>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeSub}>Unlock all mentors + weekly synthesis</Text>
              </View>
              <Text style={styles.upgradePrice}>$9.99/mo →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Career Stage */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Career Stage</Text>
          {stages.map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[styles.row, careerStage === stage && styles.rowActive]}
              onPress={() => setCareerStage(stage)}
              accessibilityRole="radio"
              accessibilityState={{ checked: careerStage === stage }}
              accessibilityLabel={`Career stage: ${CAREER_STAGE_LABELS[stage]}`}
            >
              <Text style={[styles.rowLabel, careerStage === stage && styles.rowLabelActive]}>
                {CAREER_STAGE_LABELS[stage]}
              </Text>
              {careerStage === stage && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Daily Session Reminder</Text>
          <View style={styles.timeGrid}>
            {NOTIFICATION_TIMES.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeChip, notificationTime === time && styles.timeChipActive]}
                onPress={() => setNotificationTime(time)}
                accessibilityRole="radio"
                accessibilityState={{ checked: notificationTime === time }}
                accessibilityLabel={`Set reminder to ${time}`}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    notificationTime === time && styles.timeChipTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Mode</Text>
            <Text style={styles.rowValue}>{isDemoMode ? 'Demo' : 'Live'}</Text>
          </View>
        </View>

        {/* Reset (demo only) */}
        {isDemoMode && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setHasCompletedOnboarding(false);
              setCareerStage('starting_out');
            }}
            accessibilityRole="button"
            accessibilityLabel="Reset app to onboarding"
          >
            <Text style={styles.resetButtonText}>Reset to Onboarding (Demo)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d0d12' },
  titleRow: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 24,
  },
  section: {
    backgroundColor: '#161620',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e1e2d',
    minHeight: 52,
  },
  rowActive: {
    backgroundColor: '#1e1a2d',
  },
  rowLabel: {
    fontSize: 15,
    color: '#cbd5e1',
    flex: 1,
  },
  rowLabelActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    color: '#475569',
  },
  rowValueAccent: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#7c3aed',
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1e2d',
    minHeight: 64,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a78bfa',
    marginBottom: 2,
  },
  upgradeSub: {
    fontSize: 12,
    color: '#64748b',
  },
  upgradePrice: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '700',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    paddingTop: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e1e2d',
    borderWidth: 1,
    borderColor: '#2a2a3c',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipActive: {
    backgroundColor: '#1e1a2d',
    borderColor: '#7c3aed',
  },
  timeChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  timeChipTextActive: {
    color: '#a78bfa',
    fontWeight: '700',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 52,
  },
  resetButtonText: {
    fontSize: 13,
    color: '#475569',
  },
});
