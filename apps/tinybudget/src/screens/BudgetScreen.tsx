import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, useUnallocated } from '../lib/store';
import { isDemoMode } from '../lib/demo';
import { colors } from '../lib/colors';
import type { Category } from '../lib/types';

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function AllocationBar({ allocated, spent, income }: { allocated: number; spent: number; income: number }) {
  const allocPct = income > 0 ? Math.min(allocated / income, 1) : 0;
  const spentPct = allocated > 0 ? Math.min(spent / allocated, 1) : 0;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.allocated, { width: `${allocPct * 100}%` as `${number}%` }]}>
        <View style={[barStyles.spent, { width: `${spentPct * 100}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  allocated: {
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  spent: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
});

interface BudgetRowProps {
  category: Category;
  income: number;
  onUpdateAllocation: (id: string, amount: number) => void;
}

function BudgetRow({ category, income, onUpdateAllocation }: BudgetRowProps) {
  const startAlloc = useRef(category.allocated);
  const panX = useRef(new Animated.Value(0)).current;
  const SWIPE_SCALE = 3;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 8,
      onPanResponderGrant: () => {
        startAlloc.current = category.allocated;
        panX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        panX.setValue(g.dx);
        const delta = Math.round(g.dx * SWIPE_SCALE);
        const newVal = Math.max(0, startAlloc.current + delta);
        onUpdateAllocation(category.id, newVal);
      },
      onPanResponderRelease: () => {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, tension: 200 }).start();
      },
    }),
  ).current;

  const remaining = category.allocated - category.spent;
  const isOverspent = remaining < 0;

  return (
    <Animated.View
      style={[rowStyles.row, { transform: [{ translateX: panX }] }]}
      {...panResponder.panHandlers}
    >
      <View style={rowStyles.left}>
        <Text style={rowStyles.emoji}>{category.emoji}</Text>
        <View style={rowStyles.info}>
          <Text style={rowStyles.name}>{category.name}</Text>
          <AllocationBar
            allocated={category.allocated}
            spent={category.spent}
            income={income}
          />
        </View>
      </View>
      <View style={rowStyles.right}>
        <Text style={rowStyles.allocated}>{formatCurrency(category.allocated)}</Text>
        <Text style={[rowStyles.remaining, isOverspent && rowStyles.overspent]}>
          {isOverspent ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
        </Text>
      </View>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  right: { alignItems: 'flex-end', minWidth: 80 },
  allocated: { fontSize: 16, fontWeight: '800', color: colors.text },
  remaining: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  overspent: { color: colors.danger },
});

export default function BudgetScreen() {
  const budget = useStore((s) => s.budget);
  const categories = useStore((s) => s.categories);
  const updateAllocation = useStore((s) => s.updateAllocation);
  const unallocated = useUnallocated();

  const totalAllocated = budget.income - unallocated;
  const allocatedPct = budget.income > 0 ? Math.round((totalAllocated / budget.income) * 100) : 0;
  const isFullyAllocated = unallocated === 0;
  const isOverAllocated = unallocated < 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {isDemoMode && (
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>DEMO MODE</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Zero-based header */}
        <View style={[styles.zeroCard, isFullyAllocated && styles.zeroCardGreen, isOverAllocated && styles.zeroCardRed]}>
          <View style={styles.zeroRow}>
            <View>
              <Text style={styles.budgetName}>{budget.name}</Text>
              <Text style={styles.monthYear}>{budget.monthYear}</Text>
            </View>
            <View style={styles.incomeBlock}>
              <Text style={styles.incomeLabel}>Income</Text>
              <Text style={styles.incomeValue}>{formatCurrency(budget.income)}</Text>
            </View>
          </View>

          <View style={styles.unallocatedRow}>
            <Text style={[
              styles.unallocatedLabel,
              isOverAllocated && styles.unallocatedLabelRed,
            ]}>
              {isFullyAllocated ? '✅ Fully allocated' : isOverAllocated ? '⚠️ Over-allocated' : '📌 Unallocated'}
            </Text>
            <Text style={[
              styles.unallocatedAmount,
              isOverAllocated && styles.unallocatedAmountRed,
              isFullyAllocated && styles.unallocatedAmountGreen,
            ]}>
              {formatCurrency(Math.abs(unallocated))}
            </Text>
          </View>

          <View style={styles.zeroTrack}>
            <View style={[styles.zeroFill, { width: `${Math.min(allocatedPct, 100)}%` as `${number}%` }, isOverAllocated && styles.zeroFillRed]} />
          </View>
          <Text style={styles.zeroPct}>{allocatedPct}% allocated</Text>
        </View>

        <Text style={styles.sectionLabel}>CATEGORIES — swipe left/right to adjust</Text>

        {categories.map((cat) => (
          <BudgetRow
            key={cat.id}
            category={cat}
            income={budget.income}
            onUpdateAllocation={updateAllocation}
          />
        ))}

        {categories.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyText}>No categories yet. Add some in the Categories tab.</Text>
          </View>
        )}
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  zeroCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  zeroCardGreen: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  zeroCardRed: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  zeroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  budgetName: { fontSize: 18, fontWeight: '800', color: colors.text },
  monthYear: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  incomeBlock: { alignItems: 'flex-end' },
  incomeLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  incomeValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  unallocatedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  unallocatedLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  unallocatedLabelRed: { color: colors.danger },
  unallocatedAmount: { fontSize: 20, fontWeight: '800', color: colors.text },
  unallocatedAmountRed: { color: colors.danger },
  unallocatedAmountGreen: { color: colors.primary },
  zeroTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  zeroFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  zeroFillRed: { backgroundColor: colors.danger },
  zeroPct: { fontSize: 11, color: colors.textMuted, textAlign: 'right' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 0.8, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
