import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DEMO_VOICE_MEMO_TRANSCRIPTION } from '../data/demoContent';
import { isDemoMode } from '../lib/demo';
import {
  uploadAndTranscribeVoiceMemo,
  pollForCoachingResponse,
} from '../lib/pipeline';
import { usePocketMentorStore } from '../lib/store';

type RecordState = 'idle' | 'recording' | 'transcribing' | 'done' | 'generating' | 'ready';

type VoiceMemoNavProp = NativeStackNavigationProp<RootStackParamList, 'VoiceMemoModal'>;
type VoiceMemoRouteProp = RouteProp<RootStackParamList, 'VoiceMemoModal'>;

const BAR_COUNT = 24;
const MAX_RECORD_SECONDS = 60;
const DEMO_TRANSCRIBE_WORDS = DEMO_VOICE_MEMO_TRANSCRIPTION.split(' ');

const STATE_LABELS: Record<RecordState, string> = {
  idle: 'Tap the mic to start',
  recording: '',
  transcribing: 'Transcribing…',
  done: 'Memo ready to send',
  generating: 'Getting your coaching response…',
  ready: 'Response ready',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoiceMemoScreen() {
  const navigation = useNavigation<VoiceMemoNavProp>();
  const route = useRoute<VoiceMemoRouteProp>();
  const sessionId = route.params?.sessionId ?? 'demo-session';
  const uid = usePocketMentorStore((s) => s.uid);
  const activeMentorId = usePocketMentorStore((s) => s.activeMentorId);

  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [visibleWords, setVisibleWords] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [coachingResponse, setCoachingResponse] = useState('');
  const [pipelineError, setPipelineError] = useState('');

  const barOffsets = useRef(Array.from({ length: BAR_COUNT }, () => Math.random())).current;
  const waveAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;
  const waveLoopsRef = useRef<Animated.CompositeAnimation[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedUriRef = useRef<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

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
    // Auto-stop path: fire-and-forget so timer callback stays synchronous
    if (!isDemoMode && recordingRef.current) {
      const rec = recordingRef.current;
      recordingRef.current = null;
      rec.stopAndUnloadAsync()
        .then(() => { recordedUriRef.current = rec.getURI(); })
        .catch(console.error);
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

  // Transcription effect — demo: word-by-word animation; real: call pipeline
  useEffect(() => {
    if (recordState !== 'transcribing') return;

    if (isDemoMode) {
      setVisibleWords(0);
      const interval = setInterval(() => {
        setVisibleWords((n) => {
          if (n >= DEMO_TRANSCRIBE_WORDS.length) {
            clearInterval(interval);
            setTranscript(DEMO_VOICE_MEMO_TRANSCRIPTION);
            setRecordState('done');
            return n;
          }
          return n + 1;
        });
      }, 75);
      return () => clearInterval(interval);
    }

    // Real pipeline path
    const audioUri = recordedUriRef.current ?? '';
    if (!uid) {
      setPipelineError('Not signed in. Please restart the app.');
      setRecordState('idle');
      return;
    }

    uploadAndTranscribeVoiceMemo(uid, sessionId, audioUri)
      .then((result) => {
        setTranscript(result.transcript);
        setRecordState('done');
      })
      .catch((err: Error) => {
        console.error('Transcription error:', err);
        setPipelineError('Transcription failed. Please try again.');
        setRecordState('idle');
      });
  }, [recordState, sessionId]);

  async function handleSend() {
    if (!isDemoMode && !uid) {
      setPipelineError('Not signed in. Please restart the app.');
      return;
    }

    setRecordState('generating');
    const resolvedUid = isDemoMode ? 'demo-uid' : uid!;
    const result = await pollForCoachingResponse(resolvedUid, sessionId);
    if (result) {
      setCoachingResponse(result.coachingResponse);
      setRecordState('ready');
    } else {
      setPipelineError(
        isDemoMode
          ? 'Could not get coaching response.'
          : 'Coaching response timed out. Check back in a moment.'
      );
      setRecordState('done');
    }
  }

  async function handleMicPress() {
    if (recordState === 'idle') {
      setRecordSeconds(0);
      setPipelineError('');

      if (!isDemoMode) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          setPipelineError('Microphone permission is required to record.');
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
      }

      setRecordState('recording');
    } else if (recordState === 'recording') {
      if (!isDemoMode && recordingRef.current) {
        const rec = recordingRef.current;
        recordingRef.current = null;
        try {
          await rec.stopAndUnloadAsync();
          recordedUriRef.current = rec.getURI();
        } catch (err) {
          console.error('[VoiceMemoScreen] stopAndUnloadAsync failed:', err);
        }
      }
      stopRecording();
    }
  }

  function handleRetry() {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(console.error);
      recordingRef.current = null;
    }
    setRecordState('idle');
    setRecordSeconds(0);
    setVisibleWords(0);
    setTranscript('');
    setCoachingResponse('');
    setPipelineError('');
    recordedUriRef.current = null;
  }

  const displayTranscript = isDemoMode
    ? DEMO_TRANSCRIBE_WORDS.slice(0, visibleWords).join(' ')
    : transcript;

  const mentorName = {
    alex_chen: 'Alex',
    maya_okafor: 'Maya',
    james_navarro: 'James',
  }[activeMentorId] ?? 'Your mentor';

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
          {recordState === 'recording'
            ? `Recording · ${formatTime(recordSeconds)}`
            : STATE_LABELS[recordState]}
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
        {(recordState === 'transcribing' || recordState === 'done' || recordState === 'generating' || recordState === 'ready') && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Transcript</Text>
            <Text style={styles.transcriptText}>
              {displayTranscript}
              {recordState === 'transcribing' && isDemoMode && (
                <Text style={styles.cursor}>|</Text>
              )}
            </Text>
          </View>
        )}

        {/* Coaching response */}
        {(recordState === 'ready') && coachingResponse ? (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseLabel}>{mentorName} responded</Text>
            </View>
            <Text style={styles.responseText}>{coachingResponse}</Text>
          </View>
        ) : null}

        {/* Generating indicator */}
        {recordState === 'generating' && (
          <View style={styles.generatingRow}>
            <Text style={styles.generatingText}>
              {mentorName} is thinking…
            </Text>
          </View>
        )}

        {/* Error */}
        {pipelineError ? (
          <Text style={styles.errorText}>{pipelineError}</Text>
        ) : null}

        {/* Send button */}
        {recordState === 'done' && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            accessibilityRole="button"
            accessibilityLabel="Send voice memo reply"
          >
            <Text style={styles.sendButtonText}>Send to {mentorName} →</Text>
          </TouchableOpacity>
        )}

        {/* Done — close */}
        {recordState === 'ready' && (
          <TouchableOpacity
            style={[styles.sendButton, styles.doneButton]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.sendButtonText}>Done ✓</Text>
          </TouchableOpacity>
        )}

        {(recordState === 'done' || recordState === 'ready') && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
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
  responseCard: {
    width: '100%',
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
    marginBottom: 24,
  },
  responseHeader: {
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  responseText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  generatingRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  generatingText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
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
  doneButton: {
    backgroundColor: '#10b981',
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
