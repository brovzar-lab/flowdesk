import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/demo';

const BAR_COUNT = 24;
const MAX_DURATION = 60;

function Waveform({ isRecording }: { isRecording: boolean }) {
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;

  useEffect(() => {
    if (!isRecording) {
      anims.forEach((anim) => Animated.spring(anim, { toValue: 0.15, useNativeDriver: true }).start());
      return;
    }

    const loops = anims.map((anim, i) => {
      const delay = (i * 80) % 600;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 300 + Math.floor(Math.random() * 300),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.1 + Math.random() * 0.3,
            duration: 200 + Math.floor(Math.random() * 200),
            useNativeDriver: true,
          }),
        ])
      );
    });

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [isRecording, anims]);

  return (
    <View style={waveStyles.container} accessibilityLabel="Recording waveform">
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            {
              transform: [{ scaleY: anim }],
              opacity: isRecording ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 3,
    paddingHorizontal: 8,
  },
  bar: {
    width: 4,
    height: 60,
    borderRadius: 3,
    backgroundColor: '#a78bfa',
  },
});

export default function CaptureScreen() {
  const navigation = useNavigation();
  const incrementCapture = useStore((s) => s.incrementCapture);
  const showToast = useStore((s) => s.showToast);

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startRecording() {
    setIsRecording(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e >= MAX_DURATION - 1) {
          stopRecording();
          return MAX_DURATION;
        }
        return e + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRecording(false);
    setHasRecording(true);
  }

  function handleSave() {
    incrementCapture();
    if (isDemoMode) {
      showToast('Demo mode — not saved');
    }
    navigation.goBack();
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.waveformArea}>
          <Waveform isRecording={isRecording} />

          <Text style={styles.timerText}>
            {isRecording ? formatTime(elapsed) : hasRecording ? formatTime(elapsed) : '0:00'}
          </Text>

          {isRecording && (
            <Text style={styles.limitHint}>Auto-stops at 1:00</Text>
          )}
        </View>

        <View style={styles.controls}>
          {!isRecording && !hasRecording && (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={startRecording}
              accessibilityRole="button"
              accessibilityLabel="Start recording"
            >
              <Text style={styles.recordEmoji}>🎙️</Text>
              <Text style={styles.recordLabel}>Hold to Record</Text>
            </TouchableOpacity>
          )}

          {isRecording && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              accessibilityRole="button"
              accessibilityLabel="Stop recording"
            >
              <View style={styles.stopIcon} />
              <Text style={styles.stopLabel}>Stop</Text>
            </TouchableOpacity>
          )}

          {hasRecording && (
            <View style={styles.postRecordControls}>
              <View style={styles.playbackCard}>
                <Text style={styles.playbackTitle}>Preview</Text>
                <Text style={styles.playbackText}>
                  🎵 {formatTime(elapsed)} captured
                </Text>
                {isDemoMode && (
                  <Text style={styles.demoNote}>
                    In demo mode, audio is simulated.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save this thought"
              >
                <Text style={styles.saveButtonText}>Save Thought</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => { setHasRecording(false); setElapsed(0); }}
                accessibilityRole="button"
                accessibilityLabel="Discard and re-record"
              >
                <Text style={styles.retakeButtonText}>Re-record</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.tip}>
          {isDemoMode
            ? 'Demo mode — microphone not required. Tap record to simulate.'
            : 'Speak freely. DriftJournal transcribes and clusters your thoughts automatically.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0e17' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },

  waveformArea: { alignItems: 'center', marginTop: 32, marginBottom: 40 },
  timerText: {
    fontSize: 40,
    fontWeight: '200',
    color: '#f8f8f8',
    marginTop: 20,
    letterSpacing: 4,
  },
  limitHint: { fontSize: 12, color: '#6b7280', marginTop: 6 },

  controls: { alignItems: 'center', gap: 16 },

  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6d28d9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    gap: 4,
  },
  recordEmoji: { fontSize: 36 },
  recordLabel: { fontSize: 11, color: '#ddd6fe', fontWeight: '600' },

  stopButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  stopLabel: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  postRecordControls: { width: '100%', gap: 12, alignItems: 'center' },
  playbackCard: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#312e81',
  },
  playbackTitle: { fontSize: 11, color: '#7c3aed', fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  playbackText: { fontSize: 16, color: '#f8f8f8', fontWeight: '500' },
  demoNote: { fontSize: 11, color: '#6b7280', marginTop: 6 },

  saveButton: {
    width: '100%',
    backgroundColor: '#6d28d9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  retakeButton: {
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: { color: '#6b7280', fontSize: 14 },

  tip: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 32,
    paddingHorizontal: 16,
  },
});
