import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { onSnapshot, doc } from 'firebase/firestore';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { usePantryAIStore } from '../lib/store';
import { db } from '../lib/firebase';
import { DEMO_MEAL_PLAN } from '../data/demoContent';
import type { DayMeals, MealPlan, RecipeRef } from '../lib/types';
import type { MainTabParamList } from '../navigation/AppNavigator';

type MealPlanNav = BottomTabNavigationProp<MainTabParamList, 'MealPlan'>;

export default function MealPlanScreen() {
  const navigation = useNavigation<MealPlanNav>();
  const uid = usePantryAIStore((s) => s.uid);
  const currentPlanId = usePantryAIStore((s) => s.currentPlanId);
  const isGeneratingPlan = usePantryAIStore((s) => s.isGeneratingPlan);

  const [plan, setPlan] = useState<MealPlan | null>(isDemoMode ? DEMO_MEAL_PLAN : null);
  const [loadError, setLoadError] = useState(false);

  const todayDayIndex = new Date().getDay();
  const adjustedIndex = todayDayIndex === 0 ? 6 : todayDayIndex - 1;
  const [selectedDay, setSelectedDay] = useState(adjustedIndex);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Load plan from Firestore when planId is available
  useEffect(() => {
    if (isDemoMode || !db || !uid || !currentPlanId) return;

    setLoadError(false);
    const ref = doc(db, `users/${uid}/mealPlans/${currentPlanId}`);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) { setLoadError(true); return; }
        const data = snap.data();
        setPlan({
          id: snap.id,
          scanId: data.scanId ?? '',
          weekOf: data.weekOf ?? '',
          meals: Array.isArray(data.meals) ? (data.meals as DayMeals[]) : [],
        });
      },
      (err) => {
        console.error('[MealPlanScreen] Firestore error:', err);
        setLoadError(true);
      }
    );
    return unsub;
  }, [uid, currentPlanId]);

  const meals = plan?.meals ?? [];
  const weekOf = plan?.weekOf ?? null;
  const currentDay = meals[selectedDay] ?? null;
  const isLoading = isGeneratingPlan || (!isDemoMode && !plan && !loadError);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {isDemoMode && <DemoBanner />}
        <GeneratingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Meal Plan</Text>
          {weekOf && (
            <Text style={styles.weekLabel}>Week of {formatWeekOf(weekOf)}</Text>
          )}
        </View>

        {loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>Couldn't load plan</Text>
            <Text style={styles.emptyText}>Check your connection and try scanning again.</Text>
          </View>
        ) : meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No plan yet</Text>
            <Text style={styles.emptyText}>
              Scan your pantry to generate a personalised 7-day meal plan.
            </Text>
          </View>
        ) : (
          <>
            {/* Day selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayScrollOuter}
              contentContainerStyle={styles.dayScroll}
            >
              {meals.map((day, idx) => (
                <TouchableOpacity
                  key={day.day}
                  style={[styles.dayChip, selectedDay === idx && styles.dayChipActive]}
                  onPress={() => { setSelectedDay(idx); setExpandedMeal(null); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedDay === idx }}
                  accessibilityLabel={day.day}
                >
                  <Text style={[styles.dayChipText, selectedDay === idx && styles.dayChipTextActive]}>
                    {day.day.slice(0, 3)}
                  </Text>
                  {idx === adjustedIndex && (
                    <View style={styles.todayDot} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Meals for selected day */}
            {currentDay && (
              <View>
                <Text style={styles.dayTitle}>{currentDay.day}</Text>
                {[
                  { key: 'breakfast', label: 'Breakfast', emoji: '🌅', meal: currentDay.breakfast },
                  { key: 'lunch', label: 'Lunch', emoji: '☀️', meal: currentDay.lunch },
                  { key: 'dinner', label: 'Dinner', emoji: '🌙', meal: currentDay.dinner },
                ].map(({ key, label, emoji, meal }) => (
                  <MealCard
                    key={key}
                    label={label}
                    emoji={emoji}
                    meal={meal}
                    expanded={expandedMeal === `${selectedDay}-${key}`}
                    onToggle={() =>
                      setExpandedMeal(
                        expandedMeal === `${selectedDay}-${key}` ? null : `${selectedDay}-${key}`
                      )
                    }
                  />
                ))}
              </View>
            )}

            {/* View Shopping List CTA */}
            <TouchableOpacity
              style={styles.shoppingCta}
              onPress={() => navigation.navigate('ShoppingList')}
              accessibilityRole="button"
              accessibilityLabel="View shopping list"
            >
              <Text style={styles.shoppingCtaEmoji}>🛒</Text>
              <Text style={styles.shoppingCtaText}>View Shopping List</Text>
              <Text style={styles.shoppingCtaChevron}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MealCard({
  label,
  emoji,
  meal,
  expanded,
  onToggle,
}: {
  label: string;
  emoji: string;
  meal: RecipeRef;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${label}: ${meal.name}`}
    >
      <View style={styles.mealCardHeader}>
        <Text style={styles.mealEmoji}>{emoji}</Text>
        <View style={styles.mealHeaderText}>
          <Text style={styles.mealLabel}>{label}</Text>
          <Text style={styles.mealName}>{meal.name}</Text>
        </View>
        <View style={styles.mealMeta}>
          <Text style={styles.prepTime}>{meal.prepTimeMinutes}m</Text>
          <Text style={styles.expandChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.mealExpanded}>
          <Text style={styles.expandSectionLabel}>Ingredients</Text>
          {meal.ingredients.map((ing, i) => (
            <Text key={i} style={styles.ingredient}>· {ing}</Text>
          ))}
          <Text style={styles.expandSectionLabel}>Instructions</Text>
          <Text style={styles.instructions}>{meal.instructions}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function GeneratingSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.generatingLabel}>Generating…</Text>
      </View>
      <Text style={styles.generatingSubtitle}>
        Crafting your 7-day plan from pantry items. This takes 10–20 seconds.
      </Text>
      <Animated.View style={[styles.skeletonDayRow, { opacity }]}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <View key={d} style={styles.skeletonDayChip} />
        ))}
      </Animated.View>
      <Animated.View style={{ opacity }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonCardInner}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { width: '40%' }]} />
                <View style={[styles.skeletonLine, { width: '70%', marginTop: 8 }]} />
              </View>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function formatWeekOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070d07' },
  container: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#f0fdf4' },
  weekLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0fdf4' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  dayScrollOuter: { marginBottom: 20 },
  dayScroll: { gap: 8, paddingRight: 4 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f1a0f',
    borderWidth: 1,
    borderColor: '#1a2d1a',
    alignItems: 'center',
    minWidth: 52,
    position: 'relative',
  },
  dayChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  dayChipTextActive: { color: '#fff' },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22c55e',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0fdf4',
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: '#0f1a0f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: { fontSize: 22, marginRight: 12 },
  mealHeaderText: { flex: 1 },
  mealLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mealName: { fontSize: 15, fontWeight: '600', color: '#f0fdf4' },
  mealMeta: { alignItems: 'flex-end', gap: 4 },
  prepTime: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  expandChevron: { fontSize: 10, color: '#374151' },
  mealExpanded: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1a2d1a',
    gap: 4,
  },
  expandSectionLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  ingredient: { fontSize: 14, color: '#d1fae5', lineHeight: 22 },
  instructions: { fontSize: 14, color: '#cbd5e1', lineHeight: 22 },
  shoppingCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1a0f',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  shoppingCtaEmoji: { fontSize: 22, marginRight: 12 },
  shoppingCtaText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#86efac' },
  shoppingCtaChevron: { fontSize: 22, color: '#374151' },
  // Skeleton
  skeletonContainer: { paddingHorizontal: 24, paddingTop: 24 },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  generatingLabel: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  generatingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  skeletonDayRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  skeletonDayChip: {
    width: 44,
    height: 34,
    borderRadius: 20,
    backgroundColor: '#1a2d1a',
  },
  skeletonCard: {
    backgroundColor: '#0f1a0f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  skeletonCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a2d1a',
  },
  skeletonLines: { flex: 1, gap: 0 },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a2d1a',
  },
});
