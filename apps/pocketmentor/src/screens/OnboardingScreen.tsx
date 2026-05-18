import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { CareerStage } from '../lib/types';
import { usePocketMentorStore } from '../lib/store';
import { CAREER_STAGE_LABELS, CAREER_STAGE_DESCRIPTIONS } from '../data/demoContent';

const STAGES: CareerStage[] = ['starting_out', 'in_the_grind', 'making_a_move'];

const STAGE_EMOJIS: Record<CareerStage, string> = {
  starting_out: '🌱',
  in_the_grind: '⚙️',
  making_a_move: '🚀',
};

export default function OnboardingScreen() {
  const setCareerStage = usePocketMentorStore((s) => s.setCareerStage);
  const setHasCompletedOnboarding = usePocketMentorStore((s) => s.setHasCompletedOnboarding);

  function handleSelect(stage: CareerStage) {
    setCareerStage(stage);
    setHasCompletedOnboarding(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoEmoji}>🎙</Text>
          <Text style={styles.logo}>PocketMentor</Text>
        </View>
        <Text style={styles.tagline}>Daily career coaching. Just 3 minutes.</Text>
      </View>

      <View style={styles.promptSection}>
        <Text style={styles.prompt}>Where are you right now?</Text>
        <Text style={styles.sub}>Your mentor adapts to your situation every day.</Text>
      </View>

      <View style={styles.stages}>
        {STAGES.map((stage) => (
          <TouchableOpacity
            key={stage}
            style={styles.card}
            onPress={() => handleSelect(stage)}
            accessibilityRole="button"
            accessibilityLabel={`Select career stage: ${CAREER_STAGE_LABELS[stage]}`}
          >
            <Text style={styles.cardEmoji}>{STAGE_EMOJIS[stage]}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{CAREER_STAGE_LABELS[stage]}</Text>
              <Text style={styles.cardDesc}>{CAREER_STAGE_DESCRIPTIONS[stage]}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>You can change this anytime in Settings.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d12',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 56,
    marginBottom: 48,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  logoEmoji: { fontSize: 28 },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
  },
  tagline: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  promptSection: {
    marginBottom: 32,
  },
  prompt: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  stages: {
    gap: 12,
  },
  card: {
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3c',
    minHeight: 80,
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  chevron: {
    fontSize: 22,
    color: '#334155',
    marginLeft: 8,
  },
  footer: {
    marginTop: 36,
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
});
