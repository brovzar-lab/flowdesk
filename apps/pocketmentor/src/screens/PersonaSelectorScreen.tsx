import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { DEMO_MENTORS } from '../data/demoContent';
import { usePocketMentorStore } from '../lib/store';
import { isDemoMode } from '../lib/demo';
import { DemoBanner } from '../components/DemoBanner';
import type { MentorId } from '../lib/types';

const MENTOR_ACCENT: Record<MentorId, string> = {
  alex_chen: '#7c3aed',
  maya_okafor: '#10b981',
  james_navarro: '#f59e0b',
};

export default function PersonaSelectorScreen() {
  const activeMentorId = usePocketMentorStore((s) => s.activeMentorId);
  const setActiveMentorId = usePocketMentorStore((s) => s.setActiveMentorId);
  const setPaywallVisible = usePocketMentorStore((s) => s.setPaywallVisible);

  function handleMentorPress(mentorId: MentorId, locked: boolean) {
    if (locked) {
      setPaywallVisible(true);
      return;
    }
    setActiveMentorId(mentorId);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Your Mentors</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Choose who guides your daily sessions. Each mentor has a distinct coaching
          philosophy — pick the one that fits your moment.
        </Text>

        {DEMO_MENTORS.map((mentor) => {
          const isActive = mentor.id === activeMentorId;
          const accent = MENTOR_ACCENT[mentor.id];

          return (
            <TouchableOpacity
              key={mentor.id}
              style={[
                styles.card,
                isActive && { borderColor: accent },
                mentor.locked && styles.cardLocked,
              ]}
              onPress={() => handleMentorPress(mentor.id, mentor.locked)}
              accessibilityRole="button"
              accessibilityLabel={
                mentor.locked
                  ? `${mentor.name} — locked, tap to unlock`
                  : isActive
                  ? `${mentor.name} — active mentor`
                  : `Select ${mentor.name} as your mentor`
              }
            >
              {/* Avatar */}
              <View style={[styles.avatar, { borderColor: mentor.locked ? '#2a2a3c' : accent }]}>
                <Text style={styles.avatarEmoji}>{mentor.emoji}</Text>
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.mentorName, mentor.locked && styles.lockedText]}>
                    {mentor.name}
                  </Text>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: accent }]}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                  {mentor.locked && (
                    <Text style={styles.lockBadge}>🔒</Text>
                  )}
                </View>
                <Text style={[styles.archetype, { color: mentor.locked ? '#334155' : accent }]}>
                  {mentor.archetype}
                </Text>
                <Text style={[styles.style, mentor.locked && styles.lockedText]}>
                  {mentor.locked ? mentor.lockReason : mentor.style}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingTop: 20,
    paddingBottom: 40,
    gap: 14,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 21,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#161620',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#2a2a3c',
    gap: 16,
  },
  cardLocked: {
    opacity: 0.65,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e1e2d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  mentorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  lockedText: { color: '#475569' },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockBadge: { fontSize: 14 },
  archetype: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  style: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },
});
