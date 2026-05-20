import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { usePantryAIStore } from '../lib/store';
import { DEMO_DETECTED_ITEMS, CATEGORY_EMOJI } from '../data/demoContent';
import type { DetectedItem } from '../lib/types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ReviewNav = NativeStackNavigationProp<RootStackParamList>;
type ReviewRoute = RouteProp<RootStackParamList, 'ScanReview'>;

const LOW_CONFIDENCE_THRESHOLD = 0.7;

export default function ScanReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
  const route = useRoute<ReviewRoute>();
  const setCurrentScanId = usePantryAIStore((s) => s.setCurrentScanId);
  const uid = usePantryAIStore((s) => s.uid);

  const { items: initialItems, scanId } = route.params;

  const [items, setItems] = useState<DetectedItem[]>(
    isDemoMode ? DEMO_DETECTED_ITEMS : initialItems
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [manualInput, setManualInput] = useState('');

  function startEdit(item: DetectedItem) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  function commitEdit(id: string) {
    const trimmed = editingName.trim();
    if (trimmed) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, name: trimmed } : item))
      );
    }
    setEditingId(null);
    setEditingName('');
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addManualItem() {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const newItem: DetectedItem = {
      id: `manual-${Date.now()}`,
      name: trimmed,
      confidence: 1.0,
      category: 'other',
      userConfirmed: true,
    };
    setItems((prev) => [...prev, newItem]);
    setManualInput('');
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

    try {
      const { db } = await import('../lib/firebase');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      if (!db || !scanId || !uid) return;

      await setDoc(
        doc(db, `users/${uid}/pantryScans/${scanId}`),
        {
          detectedItems: confirmed,
          confirmedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCurrentScanId(scanId);
    } catch (err) {
      console.error('[ScanReview] Firestore update failed:', err);
    }

    navigation.navigate('MainTabs');
  }

  const lowConfidenceCount = items.filter(
    (i) => i.confidence < LOW_CONFIDENCE_THRESHOLD
  ).length;
  const showRescanPrompt = items.length < 5;

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back to camera"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Items</Text>
        <Text style={styles.count}>{items.length} items</Text>
      </View>

      <Text style={styles.subtitle}>
        Edit names, remove wrong items, or add what the scan missed.
        {lowConfidenceCount > 0
          ? ` ${lowConfidenceCount} item${lowConfidenceCount > 1 ? 's' : ''} flagged as low confidence.`
          : ''}
      </Text>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const isLow = item.confidence < LOW_CONFIDENCE_THRESHOLD;
          const isEditing = editingId === item.id;

          return (
            <View key={item.id} style={[styles.itemRow, isLow && styles.itemRowLow]}>
              <Text style={styles.itemEmoji}>{CATEGORY_EMOJI[item.category] ?? '📦'}</Text>

              <View style={styles.itemInfo}>
                {isEditing ? (
                  <TextInput
                    style={styles.nameInput}
                    value={editingName}
                    onChangeText={setEditingName}
                    onSubmitEditing={() => commitEdit(item.id)}
                    onBlur={() => commitEdit(item.id)}
                    autoFocus
                    returnKeyType="done"
                    selectTextOnFocus
                    accessibilityLabel="Edit item name"
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => startEdit(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit name: ${item.name}`}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Text style={[styles.itemName, isLow && styles.itemNameLow]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.itemMeta}>
                  <Text style={styles.itemCategory}>
                    {item.category}
                  </Text>
                  <View style={[styles.confidenceBadge, isLow && styles.confidenceBadgeLow]}>
                    <Text style={[styles.confidenceText, isLow && styles.confidenceTextLow]}>
                      {Math.round(item.confidence * 100)}%
                    </Text>
                  </View>
                  {isLow && (
                    <Text style={styles.lowConfidenceTag}>low confidence</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => removeItem(item.id)}
                style={styles.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add manually row */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Add item manually…"
            placeholderTextColor="#4b5563"
            returnKeyType="done"
            onSubmitEditing={addManualItem}
            accessibilityLabel="Add item manually"
          />
          <TouchableOpacity
            onPress={addManualItem}
            style={[styles.addBtn, !manualInput.trim() && styles.addBtnDisabled]}
            disabled={!manualInput.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add item"
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* Re-scan prompt */}
        {showRescanPrompt && (
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text style={styles.rescanBtnText}>
              Only {items.length} item{items.length !== 1 ? 's' : ''} detected — Re-scan for better results
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, items.length === 0 && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={items.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Generate meal plan from these items"
        >
          <Text style={styles.confirmBtnText}>
            Generate Meal Plan →
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          {isDemoMode
            ? 'Demo mode — plan will use hardcoded data'
            : `${items.length} item${items.length !== 1 ? 's' : ''} confirmed`}
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
  list: { paddingHorizontal: 20, paddingBottom: 16 },
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
    gap: 10,
  },
  itemRowLow: {
    borderColor: '#3d2e10',
    backgroundColor: '#130f07',
  },
  itemEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#f0fdf4' },
  itemNameLow: { color: '#d1a24a' },
  nameInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0fdf4',
    backgroundColor: '#162316',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemCategory: { fontSize: 11, color: '#6b7280' },
  confidenceBadge: {
    backgroundColor: '#162316',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confidenceBadgeLow: { backgroundColor: '#2a1d08' },
  confidenceText: { fontSize: 11, fontWeight: '600', color: '#22c55e' },
  confidenceTextLow: { color: '#d1a24a' },
  lowConfidenceTag: { fontSize: 10, color: '#78521a', fontStyle: 'italic' },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a1212',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d1a1a',
  },
  deleteBtnText: { color: '#9b3535', fontSize: 13, fontWeight: '700' },
  addRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a2d1a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#f0fdf4',
    minHeight: 48,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#1a2d1a' },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a2d1a',
    gap: 10,
  },
  rescanBtn: {
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  rescanBtnText: { fontSize: 13, color: '#22c55e', fontWeight: '500' },
  confirmBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footerNote: { fontSize: 12, color: '#374151', textAlign: 'center' },
});
