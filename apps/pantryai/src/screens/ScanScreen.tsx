import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ScanNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function ScanScreen() {
  const navigation = useNavigation<ScanNav>();
  const [scanning, setScanning] = useState(false);

  function handleSimulateScan() {
    setScanning(true);
    // Simulate 2.5s processing then navigate to review
    setTimeout(() => {
      setScanning(false);
      navigation.navigate('ScanReview');
    }, 2500);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <View style={styles.container}>
        <Text style={styles.title}>Scan Pantry</Text>
        <Text style={styles.subtitle}>
          {isDemoMode
            ? 'Demo mode: tap below to simulate a pantry scan.'
            : 'Point your camera at your fridge or pantry shelf.'}
        </Text>

        {/* Camera viewfinder placeholder */}
        <View style={styles.viewfinder}>
          {scanning ? (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.scanningText}>Analyzing your pantry…</Text>
              <Text style={styles.scanningSubText}>Detecting items with Gemini Vision</Text>
            </View>
          ) : (
            <>
              <Text style={styles.cameraIcon}>📷</Text>
              <View style={styles.framingCornerTL} />
              <View style={styles.framingCornerTR} />
              <View style={styles.framingCornerBL} />
              <View style={styles.framingCornerBR} />
              <View style={styles.frameHint}>
                <Text style={styles.frameHintText}>Fit your fridge in the frame</Text>
              </View>
            </>
          )}
        </View>

        {/* Photo tips */}
        <View style={styles.tipsRow}>
          {TIPS.map((tip) => (
            <View key={tip.label} style={styles.tip}>
              <Text style={styles.tipEmoji}>{tip.emoji}</Text>
              <Text style={styles.tipLabel}>{tip.label}</Text>
            </View>
          ))}
        </View>

        {/* Capture / Simulate button */}
        {!scanning && (
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={handleSimulateScan}
            accessibilityRole="button"
            accessibilityLabel={isDemoMode ? 'Simulate pantry scan' : 'Capture pantry photo'}
          >
            <Text style={styles.captureBtnText}>
              {isDemoMode ? '✦  Simulate Scan' : '📷  Capture Photo'}
            </Text>
          </TouchableOpacity>
        )}

        {isDemoMode && !scanning && (
          <Text style={styles.demoNote}>
            In production this opens your camera for a live capture.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const TIPS = [
  { emoji: '💡', label: 'Good lighting' },
  { emoji: '🚪', label: 'Open fridge door' },
  { emoji: '📐', label: 'Fit in frame' },
];

const CORNER_SIZE = 22;
const CORNER_BORDER = 3;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070d07' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#f0fdf4', marginBottom: 8, alignSelf: 'flex-start' },
  subtitle: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 24, alignSelf: 'flex-start' },
  viewfinder: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#0f1a0f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a2d1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraIcon: { fontSize: 56, opacity: 0.3 },
  scanningOverlay: {
    alignItems: 'center',
    gap: 12,
  },
  scanningText: { fontSize: 17, fontWeight: '700', color: '#f0fdf4', marginTop: 8 },
  scanningSubText: { fontSize: 13, color: '#6b7280' },
  framingCornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: '#22c55e',
    borderTopLeftRadius: 4,
  },
  framingCornerTR: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: '#22c55e',
    borderTopRightRadius: 4,
  },
  framingCornerBL: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderColor: '#22c55e',
    borderBottomLeftRadius: 4,
  },
  framingCornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderColor: '#22c55e',
    borderBottomRightRadius: 4,
  },
  frameHint: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(7,13,7,0.7)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  frameHintText: { fontSize: 12, color: '#86efac', fontWeight: '500' },
  tipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  tip: {
    flex: 1,
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2d1a',
    gap: 4,
  },
  tipEmoji: { fontSize: 18 },
  tipLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  captureBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    width: '100%',
  },
  captureBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  demoNote: { marginTop: 12, fontSize: 12, color: '#374151', textAlign: 'center' },
});
