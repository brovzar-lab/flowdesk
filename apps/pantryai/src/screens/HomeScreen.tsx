import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { usePantryAIStore } from '../lib/store';
import { DEMO_DETECTED_ITEMS, DEMO_MEAL_PLAN, CATEGORY_EMOJI } from '../data/demoContent';
import type { MainTabParamList } from '../navigation/AppNavigator';

type HomeNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const uid = usePantryAIStore((s) => s.uid);
  const scansThisMonth = usePantryAIStore((s) => s.scansThisMonth);
  const isPremium = usePantryAIStore((s) => s.isPremium);

  const hasScan = isDemoMode || false;
  const scanItems = isDemoMode ? DEMO_DETECTED_ITEMS : [];
  const mealPlan = isDemoMode ? DEMO_MEAL_PLAN : null;
  const scansRemaining = isPremium ? '∞' : String(Math.max(0, 3 - scansThisMonth));

  const todayIndex = new Date().getDay();
  const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const todayMeals = mealPlan?.meals[adjustedIndex] ?? mealPlan?.meals[0] ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.subGreeting}>
              {isDemoMode ? 'Demo User' : uid?.slice(0, 8) ?? 'there'}
            </Text>
          </View>
          <View style={styles.scanBadge}>
            <Text style={styles.scanBadgeLabel}>Scans left</Text>
            <Text style={styles.scanBadgeCount}>{scansRemaining}</Text>
          </View>
        </View>

        {/* New Scan CTA */}
        <TouchableOpacity
          style={styles.scanCta}
          onPress={() => navigation.navigate('Scan')}
          accessibilityRole="button"
          accessibilityLabel="Scan your pantry"
        >
          <Text style={styles.scanCtaEmoji}>📷</Text>
          <View style={styles.scanCtaText}>
            <Text style={styles.scanCtaTitle}>Scan Your Pantry</Text>
            <Text style={styles.scanCtaSub}>Point your camera at the fridge</Text>
          </View>
          <Text style={styles.scanCtaChevron}>›</Text>
        </TouchableOpacity>

        {/* Today's meals */}
        {todayMeals && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Today — {todayMeals.day}</Text>
            {[
              { label: 'Breakfast', meal: todayMeals.breakfast, emoji: '🌅' },
              { label: 'Lunch', meal: todayMeals.lunch, emoji: '☀️' },
              { label: 'Dinner', meal: todayMeals.dinner, emoji: '🌙' },
            ].map(({ label, meal, emoji }) => (
              <View key={label} style={styles.mealRow}>
                <Text style={styles.mealEmoji}>{emoji}</Text>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{label}</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.prepTimeMinutes} min</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewPlanBtn}
              onPress={() => navigation.navigate('MealPlan')}
              accessibilityRole="button"
            >
              <Text style={styles.viewPlanBtnText}>View Full 7-Day Plan →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Last scan summary */}
        {hasScan && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Last Scan</Text>
            <Text style={styles.scanItemCount}>
              {scanItems.length} items detected
            </Text>
            <View style={styles.categoryGrid}>
              {groupByCategory(scanItems).map(([cat, items]) => (
                <View key={cat} style={styles.categoryChip}>
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[cat] ?? '📦'}</Text>
                  <Text style={styles.categoryName}>{items.length} {cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function groupByCategory(items: typeof DEMO_DETECTED_ITEMS) {
  const map = new Map<string, typeof DEMO_DETECTED_ITEMS>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries());
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070d07' },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  subGreeting: { fontSize: 22, fontWeight: '800', color: '#f0fdf4', marginTop: 2 },
  scanBadge: {
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  scanBadgeLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  scanBadgeCount: { fontSize: 22, fontWeight: '800', color: '#22c55e', marginTop: 2 },
  scanCta: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  scanCtaEmoji: { fontSize: 28, marginRight: 14 },
  scanCtaText: { flex: 1 },
  scanCtaTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 2 },
  scanCtaSub: { fontSize: 13, color: '#bbf7d0' },
  scanCtaChevron: { fontSize: 22, color: '#fff', marginLeft: 8 },
  section: {
    backgroundColor: '#0f1a0f',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  mealEmoji: { fontSize: 20, marginRight: 12, marginTop: 1 },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  mealName: { fontSize: 15, fontWeight: '600', color: '#f0fdf4', marginTop: 2 },
  mealTime: { fontSize: 12, color: '#22c55e', marginTop: 2 },
  viewPlanBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a2d1a',
  },
  viewPlanBtnText: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  scanItemCount: { fontSize: 18, fontWeight: '700', color: '#f0fdf4', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162316',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  categoryEmoji: { fontSize: 14 },
  categoryName: { fontSize: 12, color: '#86efac', fontWeight: '500' },
});
