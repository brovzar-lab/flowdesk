import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../lib/store';
import { isDemoMode, PRESET_CATEGORIES } from '../lib/demo';
import { colors } from '../lib/colors';
import type { Category, OnboardingStep } from '../lib/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const STEPS: OnboardingStep[] = ['income', 'categories', 'name'];
const STEP_LABELS = ['Income', 'Categories', 'Name'];

function ProgressDots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {STEPS.map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive, i < current && styles.dotDone]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen(_props: Props) {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([
    'Housing', 'Food', 'Transport', 'Entertainment', 'Savings', 'Other',
  ]);
  const [budgetName, setBudgetName] = useState('');
  const [shake] = useState(new Animated.Value(0));

  const currentStep = STEPS[step];

  function triggerShake() {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function togglePreset(name: string) {
    setSelectedPresets((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function canAdvance(): boolean {
    if (currentStep === 'income') return parseFloat(income) > 0;
    if (currentStep === 'categories') return selectedPresets.length >= 1;
    if (currentStep === 'name') return budgetName.trim().length >= 1;
    return false;
  }

  function handleNext() {
    if (!canAdvance()) {
      triggerShake();
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    const incomeNum = parseFloat(income) || 0;
    const perCategory = Math.floor(incomeNum / selectedPresets.length);
    const cats: Category[] = selectedPresets.map((name, i) => {
      const preset = PRESET_CATEGORIES.find((p) => p.name === name);
      return {
        id: `cat-${Date.now()}-${i}`,
        name,
        emoji: preset?.emoji ?? '📦',
        allocated: perCategory,
        spent: 0,
        color: colors.categoryColors[i % colors.categoryColors.length],
      };
    });

    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    completeOnboarding(
      { name: budgetName.trim() || 'My Budget', income: incomeNum, monthYear },
      cats,
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isDemoMode && (
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>DEMO MODE</Text>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
          <ProgressDots current={step} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ transform: [{ translateX: shake }] }}>
            {currentStep === 'income' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>What's your monthly income?</Text>
                <Text style={styles.stepSubtitle}>
                  We'll use this as the total amount to allocate across categories.
                </Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.incomeInput}
                    value={income}
                    onChangeText={setIncome}
                    placeholder="5,000"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    returnKeyType="done"
                    autoFocus
                  />
                </View>
                <Text style={styles.hint}>Enter your take-home pay after tax</Text>
              </View>
            )}

            {currentStep === 'categories' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Choose your categories</Text>
                <Text style={styles.stepSubtitle}>
                  Select the areas where you spend money. You can customize these later.
                </Text>
                <View style={styles.presetGrid}>
                  {PRESET_CATEGORIES.map((p) => {
                    const selected = selectedPresets.includes(p.name);
                    return (
                      <TouchableOpacity
                        key={p.name}
                        style={[styles.presetChip, selected && styles.presetChipSelected]}
                        onPress={() => togglePreset(p.name)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.presetEmoji}>{p.emoji}</Text>
                        <Text style={[styles.presetName, selected && styles.presetNameSelected]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.hint}>{selectedPresets.length} selected</Text>
              </View>
            )}

            {currentStep === 'name' && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Name your budget</Text>
                <Text style={styles.stepSubtitle}>
                  Give this month's budget a name so you can recognize it later.
                </Text>
                <TextInput
                  style={styles.nameInput}
                  value={budgetName}
                  onChangeText={setBudgetName}
                  placeholder="April Budget"
                  placeholderTextColor={colors.textLight}
                  returnKeyType="done"
                  autoFocus
                  onSubmitEditing={handleNext}
                />
                <Text style={styles.hint}>e.g. "April Budget" or "Q2 Plan"</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {step === STEPS.length - 1 ? 'Start Budgeting 🎉' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  demoBadge: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  demoBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  header: { padding: 20, paddingTop: 16, alignItems: 'center' },
  backBtn: { position: 'absolute', left: 20, top: 18 },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  stepLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  dotDone: { backgroundColor: colors.primaryLight },
  scroll: { flexGrow: 1, padding: 24 },
  stepContainer: { gap: 12 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  stepSubtitle: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  currencySymbol: { fontSize: 28, fontWeight: '700', color: colors.primary, marginRight: 4 },
  incomeInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 16,
  },
  hint: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  presetEmoji: { fontSize: 18 },
  presetName: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  presetNameSelected: { color: colors.primary },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  footer: { padding: 20, paddingBottom: 24 },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
