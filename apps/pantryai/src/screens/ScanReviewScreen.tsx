import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isDemoMode } from '../lib/demo';
import { usePantryAIStore } from '../lib/store';
import { DEMO_DETECTED_ITEMS, CATEGORY_EMOJI } from '../data/demoContent';
import type { DetectedItem } from '../lib/types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ReviewNav = NativeStackNavigationProp<RootStackParamList, 'ScanReview'>;

export default function ScanReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
  const setCurrentScanId = usePantryAIStore((s) => s.setCurrentScanId);

  const [items, setItems] = useState<DetectedItem[]>(
    isDemoMode ? DEMO_DETECTED_ITEMS : []
  );

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, userConfirmed: !item.userConfirmed } : item
      )
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleConfirm() {
    const confirmed = items.filter((i) => i.userConfirmed);
    if (confirmed.length === 0) {
      Alert.alert('No items selected', 'Please confirm at least one detected item.');
      return;
    }

    if (isDemoMode) {
      setCurrentScanId('demo-scan-1');
      navigation.navigate('MainTabs');
      return;
    }

    // Real mode: write scan to Firestore
    try {
      const { db } = await import('../lib/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      if (!db) return;
      const { uid } = usePantryAIStore.getState();
      if (!uid) return;
      const ref = await addDoc(collection(db, `users/${uid}/pantryScans`), {
        status: 'done',
        detectedItems: confirmed,
        createdAt: serverTimestamp(),
      });
      setCurrentScanId(ref.id);
    } catch (err) {
      console.error('[ScanReview] Firestore write failed:', err);
    }

    navigation.navigate('MainTabs');
  }

  const confirmed = items.filter((i) => i.userConfirmed);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Items</Text>
        <Text style={styles.count}>{confirmed.length} selected</Text>
      </View>

      <Text style={styles.subtitle}>
        Tap to deselect items the AI got wrong. Long-press to remove.
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, !item.userConfirmed && styles.itemRowDeselected]}
            onPress={() => toggleItem(item.id)}
            onLongPress={() => removeItem(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.userConfirmed }}
            accessibilityLabel={`${item.name}, confidence ${Math.round(item.confidence * 100)}%`}
          >
            <View style={[styles.checkbox, item.userConfirmed && styles.checkboxChecked]}>
              {item.userConfirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, !item.userConfirmed && styles.itemNameDeselected]}>
                {item.name}
              </Text>
              <Text style={styles.itemMeta}>
                {CATEGORY_EMOJI[item.category]} {item.category} ·{' '}
                {Math.round(item.confidence * 100)}% confidence
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, confirmed.length === 0 && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={confirmed.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Confirm pantry items and generate meal plan"
        >
          <Text style={styles.confirmBtnText}>
            Confirm {confirmed.length} Items & Generate Plan →
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          {isDemoMode ? 'Demo mode — plan will use hardcoded data' : 'AI meal plan will be generated'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070d07' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: { paddingRight: 8, minHeight: 44, justifyContent: 'center' },
  backText: { color: '#22c55e', fontSize: 15 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#f0fdf4' },
  count: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingBottom: 12,
    lineHeight: 18,
  },
  list: { paddingHorizontal: 20, paddingBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a2d1a',
    minHeight: 60,
  },
  itemRowDeselected: { opacity: 0.4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#f0fdf4', marginBottom: 2 },
  itemNameDeselected: { color: '#6b7280' },
  itemMeta: { fontSize: 12, color: '#6b7280' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a2d1a',
    gap: 8,
  },
  confirmBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footerNote: { fontSize: 12, color: '#374151', textAlign: 'center' },
});
