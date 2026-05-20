import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { usePantryAIStore } from '../lib/store';
import { db } from '../lib/firebase';
import { DEMO_SHOPPING_ITEMS, CATEGORY_EMOJI } from '../data/demoContent';
import type { ShoppingItem, IngredientCategory } from '../lib/types';

export default function ShoppingListScreen() {
  const uid = usePantryAIStore((s) => s.uid);
  const currentListId = usePantryAIStore((s) => s.currentListId);

  const [items, setItems] = useState<ShoppingItem[]>(
    isDemoMode ? DEMO_SHOPPING_ITEMS : []
  );
  const [listDocRef, setListDocRef] = useState<ReturnType<typeof doc> | null>(null);

  // Subscribe to Firestore shopping list
  useEffect(() => {
    if (isDemoMode || !db || !uid || !currentListId) return;

    const ref = doc(db, `users/${uid}/shoppingLists/${currentListId}`);
    setListDocRef(ref);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (Array.isArray(data.items)) {
          setItems(data.items as ShoppingItem[]);
        }
      },
      (err) => {
        console.error('[ShoppingListScreen] Firestore error:', err);
      }
    );
    return () => { unsub(); setListDocRef(null); };
  }, [uid, currentListId]);

  // Persist updated items array to Firestore (offline-capable: queued locally if offline)
  const persistItems = useCallback(
    async (updatedItems: ShoppingItem[]) => {
      if (!listDocRef || isDemoMode) return;
      try {
        await updateDoc(listDocRef, { items: updatedItems });
      } catch (err) {
        console.error('[ShoppingListScreen] Failed to persist items:', err);
      }
    },
    [listDocRef]
  );

  function toggleItem(id: string) {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    void persistItems(updatedItems);
  }

  function uncheckAll() {
    const updatedItems = items.map((item) => ({ ...item, checked: false }));
    setItems(updatedItems);
    void persistItems(updatedItems);
  }

  function clearChecked() {
    const updatedItems = items.filter((item) => !item.checked);
    setItems(updatedItems);
    void persistItems(updatedItems);
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
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unchecked.length} left</Text>
            </View>
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
            {/* Action buttons */}
            {items.length > 0 && (
              <View style={styles.actionRow}>
                {checked.length > 0 && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={uncheckAll}
                    accessibilityRole="button"
                    accessibilityLabel="Uncheck all items"
                  >
                    <Text style={styles.actionBtnText}>Uncheck all</Text>
                  </TouchableOpacity>
                )}
                {checked.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDestructive]}
                    onPress={clearChecked}
                    accessibilityRole="button"
                    accessibilityLabel="Clear checked items"
                  >
                    <Text style={[styles.actionBtnText, styles.actionBtnTextDestructive]}>
                      Clear checked ({checked.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

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
                  <Text style={styles.categoryCount}>{catItems.length}</Text>
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
        {item.quantity ? (
          <Text style={styles.itemQty}>{item.quantity}</Text>
        ) : null}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#f0fdf4' },
  countBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countBadgeText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0fdf4' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  actionBtn: {
    backgroundColor: '#0f1a0f',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  actionBtnDestructive: {
    borderColor: '#2d1a1a',
    backgroundColor: '#1a0f0f',
  },
  actionBtnText: { fontSize: 13, color: '#86efac', fontWeight: '500' },
  actionBtnTextDestructive: { color: '#f87171' },
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
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
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
