import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { DEMO_SHOPPING_ITEMS, CATEGORY_EMOJI } from '../data/demoContent';
import type { ShoppingItem, IngredientCategory } from '../lib/types';

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>(
    isDemoMode ? DEMO_SHOPPING_ITEMS : []
  );

  function toggleItem(id: string) {
    if (isDemoMode) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
      return;
    }
    // Real mode: update Firestore
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const grouped = groupByCategory(unchecked);

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Shopping List</Text>
          {items.length > 0 && (
            <Text style={styles.progressLabel}>
              {checked.length}/{items.length} done
            </Text>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>List is empty</Text>
            <Text style={styles.emptyText}>
              Your shopping list is generated automatically when you create a meal plan.
            </Text>
          </View>
        ) : (
          <>
            {/* Unchecked items grouped by category */}
            {grouped.map(([category, catItems]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>
                    {CATEGORY_EMOJI[category] ?? '📦'}
                  </Text>
                  <Text style={styles.categoryTitle}>
                    {capitalize(category)}
                  </Text>
                </View>
                {catItems.map((item) => (
                  <ShoppingRow key={item.id} item={item} onToggle={toggleItem} />
                ))}
              </View>
            ))}

            {/* Checked items at bottom */}
            {checked.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.checkedLabel}>In Cart ({checked.length})</Text>
                {checked.map((item) => (
                  <ShoppingRow key={item.id} item={item} onToggle={toggleItem} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShoppingRow({
  item,
  onToggle,
}: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.itemRow, item.checked && styles.itemRowChecked]}
      onPress={() => onToggle(item.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked }}
      accessibilityLabel={`${item.name} ${item.quantity}`}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        <Text style={styles.itemQty}>{item.quantity}</Text>
      </View>
    </TouchableOpacity>
  );
}

function groupByCategory(items: ShoppingItem[]): [IngredientCategory, ShoppingItem[]][] {
  const map = new Map<IngredientCategory, ShoppingItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070d07' },
  container: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#f0fdf4' },
  progressLabel: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0fdf4' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  categorySection: { marginBottom: 20 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryEmoji: { fontSize: 16 },
  categoryTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkedLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a2d1a',
    minHeight: 52,
  },
  itemRowChecked: { opacity: 0.45 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#f0fdf4' },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#6b7280' },
  itemQty: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
