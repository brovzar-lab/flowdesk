import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DEMO_VOICE_MEMO_TRANSCRIPTION } from '../data/demoContent';

type RecordState = 'idle' | 'recording' | 'transcribing' | 'done';

const BAR_COUNT = 24;
const MAX_RECORD_SECONDS = 60;
const TRANSCRIBE_WORDS = DEMO_VOICE_MEMO_TRANSCRIPTION.split(' ');

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoiceMemoScreen() {
  const navigation = useNavigation();
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [visibleWords, setVisibleWords] = useState(0);

  const barOffsets = useRef(Array.from({ length: BAR_COUNT }, () => Math.random())).current;
  const waveAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;
  const waveLoopsRef = useRef<Animated.CompositeAnimation[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWave = useCallback(() => {
    waveLoopsRef.current.forEach((a) => a.stop());
    waveLoopsRef.current = waveAnims.map((anim, i) => {
      const off = barOffsets[i];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.4 + off * 0.6,
            duration: 150 + off * 250,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.1 + (1 - off) * 0.2,
            duration: 150 + (1 - off) * 250,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return loop;
    });
  }, [waveAnims, barOffsets]);

  const stopWave = useCallback(() => {
    waveLoopsRef.current.forEach((a) => a.stop());
    waveLoopsRef.current = [];
    waveAnims.forEach((anim) =>
      Animated.timing(anim, { toValue: 0.1, duration: 300, useNativeDriver: false }).start()
    );
  }, [waveAnims]);

  const stopRecording = useCallback(() => {
    stopWave();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordState('transcribing');
  }, [stopWave]);

  useEffect(() => {
    if (recordState === 'recording') {
      startWave();
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= MAX_RECORD_SECONDS - 1) {
            stopRecording();
            return MAX_RECORD_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordState, startWave, stopRecording]);

  useEffect(() => {
    if (recordState !== 'transcribing') return;

    setVisibleWords(0);
    const interval = setInterval(() => {
      setVisibleWords((n) => {
        if (n >= TRANSCRIBE_WORDS.length) {
          clearInterval(interval);
          setRecordState('done');
          return n;
        }
        return n + 1;
      });
    }, 75);
    return () => clearInterval(interval);
  }, [recordState]);

  function handleMicPress() {
    if (recordState === 'idle') {
      setRecordSeconds(0);
      setRecordState('recording');
    } else if (recordState === 'recording') {
      stopRecording();
    }
  }

  const transcriptText = TRANSCRIBE_WORDS.slice(0, visibleWords).join(' ');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close voice memo"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Memo</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* State label */}
        <Text style={styles.stateLabel}>
          {recordState === 'idle' && 'Tap the mic to start'}
          {recordState === 'recording' && `Recording · ${formatTime(recordSeconds)}`}
          {recordState === 'transcribing' && 'Transcribing…'}
          {recordState === 'done' && 'Memo ready to send'}
        </Text>

        {/* Waveform */}
        <View style={styles.waveContainer} accessibilityLabel="Voice recording waveform">
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 56],
                  }),
                  backgroundColor:
                    recordState === 'recording' ? '#ef4444' : '#2a2a3c',
                },
              ]}
            />
          ))}
        </View>

        {/* Mic button */}
        {(recordState === 'idle' || recordState === 'recording') && (
          <TouchableOpacity
            style={[styles.micButton, recordState === 'recording' && styles.micButtonActive]}
            onPress={handleMicPress}
            accessibilityRole="button"
            accessibilityLabel={
              recordState === 'recording' ? 'Stop recording' : 'Start recording'
            }
          >
            <Text style={styles.micIcon}>
              {recordState === 'recording' ? '⏹' : '🎙'}
            </Text>
          </TouchableOpacity>
        )}

        {recordState === 'recording' && (
          <Text style={styles.recordingHint}>Tap to stop · max {MAX_RECORD_SECONDS}s</Text>
        )}

        {/* Transcript */}
        {(recordState === 'transcribing' || recordState === 'done') && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Transcript</Text>
            <Text style={styles.transcriptText}>
              {transcriptText}
              {recordState === 'transcribing' && (
                <Text style={styles.cursor}>|</Text>
              )}
            </Text>
          </View>
        )}

        {/* Send button */}
        {recordState === 'done' && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Send voice memo reply"
          >
            <Text style={styles.sendButtonText}>Send Reply →</Text>
          </TouchableOpacity>
        )}

        {recordState === 'done' && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setRecordState('idle');
              setRecordSeconds(0);
              setVisibleWords(0);
            }}
            accessibilityRole="button"
            accessibilityLabel="Re-record voice memo"
          >
            <Text style={styles.retryButtonText}>Re-record</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 18, color: '#64748b' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  stateLabel: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 36,
    textAlign: 'center',
    minHeight: 22,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    gap: 4,
    marginBottom: 40,
    width: '100%',
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#2a2a3c',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e1e2d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7c3aed',
    marginBottom: 16,
  },
  micButtonActive: {
    backgroundColor: '#3b0764',
    borderColor: '#ef4444',
  },
  micIcon: { fontSize: 32 },
  recordingHint: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 24,
  },
  transcriptCard: {
    width: '100%',
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    marginBottom: 24,
  },
  transcriptLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  transcriptText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  cursor: {
    color: '#7c3aed',
    fontWeight: '800',
  },
  sendButton: {
    width: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 56,
    marginBottom: 12,
  },
  sendButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  retryButton: {
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    width: '100%',
  },
  retryButtonText: { fontSize: 14, color: '#475569' },
});
