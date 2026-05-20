import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { usePantryAIStore } from '../lib/store';
import { isDemoMode } from '../lib/demo';
import type { DietaryPref } from '../lib/types';
import { DIETARY_PREF_LABELS, DIETARY_PREF_DESCRIPTIONS } from '../data/demoContent';

const PREFS: DietaryPref[] = ['none', 'vegetarian', 'vegan'];

const PREF_EMOJIS: Record<DietaryPref, string> = {
  none: '🍗',
  vegetarian: '🥗',
  vegan: '🌱',
};

export default function OnboardingScreen() {
  const uid = usePantryAIStore((s) => s.uid);
  const setDietaryPref = usePantryAIStore((s) => s.setDietaryPref);
  const setHasCompletedOnboarding = usePantryAIStore((s) => s.setHasCompletedOnboarding);

  async function handleSelect(pref: DietaryPref) {
    setDietaryPref(pref);

    if (!isDemoMode && uid) {
      try {
        const { db } = await import('../lib/firebase');
        const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        if (db) {
          await setDoc(doc(db, `users/${uid}/profile/data`), {
            dietaryPref: pref,
            onboardingCompletedAt: serverTimestamp(),
          });
          await setDoc(doc(db, `users/${uid}/subscription/data`), {
            tier: 'free',
            scansThisMonth: 0,
            periodResetAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('[OnboardingScreen] Firestore write failed:', err);
      }
    }

    setHasCompletedOnboarding(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoEmoji}>🥦</Text>
        <Text style={styles.logo}>PantryAI</Text>
        <Text style={styles.tagline}>Scan your fridge. Get a meal plan.</Text>
      </View>

      <View style={styles.promptSection}>
        <Text style={styles.prompt}>Any dietary preferences?</Text>
        <Text style={styles.sub}>Your meal plans will be tailored to your diet.</Text>
      </View>

      <View style={styles.options}>
        {PREFS.map((pref) => (
          <TouchableOpacity
            key={pref}
            style={styles.card}
            onPress={() => handleSelect(pref)}
            accessibilityRole="button"
            accessibilityLabel={`Select diet: ${DIETARY_PREF_LABELS[pref]}`}
          >
            <Text style={styles.cardEmoji}>{PREF_EMOJIS[pref]}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{DIETARY_PREF_LABELS[pref]}</Text>
              <Text style={styles.cardDesc}>{DIETARY_PREF_DESCRIPTIONS[pref]}</Text>
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
  container: { flex: 1, backgroundColor: '#070d07', paddingHorizontal: 24 },
  header: { paddingTop: 56, marginBottom: 40, alignItems: 'center' },
  logoEmoji: { fontSize: 48, marginBottom: 8 },
  logo: { fontSize: 26, fontWeight: '800', color: '#f0fdf4' },
  tagline: { fontSize: 14, color: '#6b7280', marginTop: 6 },
  promptSection: { marginBottom: 32 },
  prompt: { fontSize: 22, fontWeight: '700', color: '#f0fdf4', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  options: { gap: 12 },
  card: {
    backgroundColor: '#0f1a0f',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2d1a',
    minHeight: 80,
  },
  cardEmoji: { fontSize: 28, marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f0fdf4', marginBottom: 3 },
  cardDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  chevron: { fontSize: 22, color: '#374151', marginLeft: 8 },
  footer: { marginTop: 36, fontSize: 12, color: '#374151', textAlign: 'center' },
});
