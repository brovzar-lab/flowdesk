import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { storage, functions as firebaseFunctions } from '../lib/firebase';
import { usePantryAIStore } from '../lib/store';
import { DEMO_DETECTED_ITEMS } from '../data/demoContent';
import type { DetectedItem } from '../lib/types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ScanNav = NativeStackNavigationProp<RootStackParamList>;
type Phase = 'idle' | 'uploading' | 'scanning' | 'error';

interface AnalyzePantryResponse {
  scanId: string;
  status: string;
  items: DetectedItem[];
  itemCount: number;
}

export default function ScanScreen() {
  const navigation = useNavigation<ScanNav>();
  const uid = usePantryAIStore((s) => s.uid);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [flashOn, setFlashOn] = useState(false);

  // ── Demo mode simulation ─────────────────────────────────────────────────
  function handleSimulateScan() {
    setPhase('scanning');
    setTimeout(() => {
      setPhase('idle');
      navigation.navigate('ScanReview', {
        items: DEMO_DETECTED_ITEMS,
        scanId: 'demo-scan-1',
      });
    }, 2500);
  }

  // ── Real capture flow ─────────────────────────────────────────────────────
  async function handleCapture() {
    if (!cameraRef.current || !uid || !storage || !firebaseFunctions) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;

      setPhase('uploading');

      const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const photoRef = storageRef(storage, `scans/${uid}/${scanId}.jpg`);

      const response = await fetch(photo.uri);
      const blob = await response.blob();
      await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });

      setPhase('scanning');

      const analyze = httpsCallable<{ scanId: string }, AnalyzePantryResponse>(
        firebaseFunctions,
        'analyzePantry'
      );
      const result = await analyze({ scanId });

      setPhase('idle');
      navigation.navigate('ScanReview', {
        items: result.data.items,
        scanId: result.data.scanId,
      });
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Scan failed. Please try again.');
    }
  }

  function handleRetry() {
    setPhase('idle');
    setErrorMsg('');
  }

  // ── Permission gate ───────────────────────────────────────────────────────
  if (!isDemoMode && !permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator color="#22c55e" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isDemoMode && !permission?.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Camera Access</Text>
          <Text style={styles.subtitle}>
            PantryAI needs camera access to scan your fridge and pantry.
          </Text>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={requestPermission}
            accessibilityRole="button"
          >
            <Text style={styles.captureBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLoading = phase === 'uploading' || phase === 'scanning';
  const loadingText = phase === 'uploading' ? 'Uploading photo…' : 'Scanning your pantry…';

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <View style={styles.container}>
        <Text style={styles.title}>Scan Pantry</Text>
        <Text style={styles.subtitle}>
          {isDemoMode
            ? 'Demo mode — tap below to simulate a scan.'
            : 'Point your camera at your fridge or pantry shelf.'}
        </Text>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>{loadingText}</Text>
              {phase === 'scanning' && (
                <Text style={styles.loadingSubText}>Detecting items with Gemini Vision</Text>
              )}
            </View>
          ) : phase === 'error' ? (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>Scan failed</Text>
              <Text style={styles.errorDetail}>{errorMsg}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={handleRetry}
                accessibilityRole="button"
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : isDemoMode ? (
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
          ) : (
            <>
              {/* Live camera */}
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                flash={flashOn ? 'on' : 'off'}
              />
              {/* Framing overlay */}
              <View style={styles.framingCornerTL} />
              <View style={styles.framingCornerTR} />
              <View style={styles.framingCornerBL} />
              <View style={styles.framingCornerBR} />
              <View style={styles.frameHint}>
                <Text style={styles.frameHintText}>Fit your fridge in the frame</Text>
              </View>
              {/* Flash toggle */}
              <TouchableOpacity
                style={styles.flashBtn}
                onPress={() => setFlashOn((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
              >
                <Text style={styles.flashBtnText}>{flashOn ? '⚡' : '🔦'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Tips row */}
        {!isLoading && phase !== 'error' && (
          <View style={styles.tipsRow}>
            {TIPS.map((tip) => (
              <View key={tip.label} style={styles.tip}>
                <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                <Text style={styles.tipLabel}>{tip.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Capture button */}
        {!isLoading && phase !== 'error' && (
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={isDemoMode ? handleSimulateScan : handleCapture}
            accessibilityRole="button"
            accessibilityLabel={isDemoMode ? 'Simulate pantry scan' : 'Capture pantry photo'}
          >
            <Text style={styles.captureBtnText}>
              {isDemoMode ? '✦  Simulate Scan' : '📷  Capture Photo'}
            </Text>
          </TouchableOpacity>
        )}

        {isDemoMode && phase === 'idle' && (
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
  loadingOverlay: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 17, fontWeight: '700', color: '#f0fdf4', marginTop: 8 },
  loadingSubText: { fontSize: 13, color: '#6b7280' },
  errorOverlay: { alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  errorIcon: { fontSize: 36 },
  errorText: { fontSize: 17, fontWeight: '700', color: '#f0fdf4' },
  errorDetail: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#1a2d1a',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { color: '#22c55e', fontWeight: '700', fontSize: 14 },
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
  flashBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(7,13,7,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnText: { fontSize: 18 },
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
