import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DEMO_SESSION, DEMO_MENTORS } from '../data/demoContent';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { usePocketMentorStore } from '../lib/store';
import type { FirestoreSession } from '../lib/types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const BAR_COUNT = 28;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const uid = usePocketMentorStore((s) => s.uid);
  const careerStage = usePocketMentorStore((s) => s.careerStage);
  const activeMentorId = usePocketMentorStore((s) => s.activeMentorId);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(DEMO_SESSION.durationSeconds);

  // Real mode state
  const [firestoreSession, setFirestoreSession] = useState<FirestoreSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!isDemoMode);
  const [sessionGenerating, setSessionGenerating] = useState(false);
  const sessionGeneratingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const barOffsets = useRef(
    Array.from({ length: BAR_COUNT }, () => Math.random())
  ).current;

  const waveAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;

  const waveLoopsRef = useRef<Animated.CompositeAnimation[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWave = useCallback(() => {
    waveLoopsRef.current.forEach((a) => a.stop());
    waveLoopsRef.current = waveAnims.map((anim, i) => {
      const off = barOffsets[i];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.35 + off * 0.65,
            duration: 180 + off * 220,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.1 + (1 - off) * 0.25,
            duration: 180 + (1 - off) * 220,
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
      Animated.timing(anim, { toValue: 0.15, duration: 400, useNativeDriver: false }).start()
    );
  }, [waveAnims]);

  // Demo mode timer
  useEffect(() => {
    if (!isDemoMode) return;
    if (isPlaying) {
      startWave();
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= DEMO_SESSION.durationSeconds) {
            setIsPlaying(false);
            return DEMO_SESSION.durationSeconds;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      stopWave();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, startWave, stopWave]);

  // Real mode: Firestore listener + session generation
  useEffect(() => {
    if (isDemoMode || !uid) return;

    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      const { db } = await import('../lib/firebase');
      if (!db) return;
      const { doc, onSnapshot } = await import('firebase/firestore');

      const sessionRef = doc(db, `users/${uid}/sessions/${today}`);
      unsubscribe = onSnapshot(sessionRef, async (snap) => {
        if (snap.exists()) {
          setFirestoreSession(snap.data() as FirestoreSession);
          setSessionLoading(false);
          sessionGeneratingRef.current = false;
          setSessionGenerating(false);
        } else if (!sessionGeneratingRef.current) {
          sessionGeneratingRef.current = true;
          setSessionGenerating(true);
          setSessionLoading(false);
          try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');
            if (functions) {
              const fn = httpsCallable(functions, 'generateDailySession');
              await fn({ mentorId: activeMentorId, careerStage });
            }
          } catch (err) {
            console.error('[HomeScreen] generateDailySession failed:', err);
            sessionGeneratingRef.current = false;
            setSessionGenerating(false);
          }
        }
      });
    };

    setup();
    return () => unsubscribe?.();
  }, [uid, today, activeMentorId, careerStage]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  async function handlePlayReal() {
    if (!firestoreSession?.audioUrl) return;

    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
          stopWave();
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          startWave();
        }
        return;
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: firestoreSession.audioUrl },
      { shouldPlay: true },
      async (status) => {
        if (!status.isLoaded) return;
        setElapsed(Math.floor(status.positionMillis / 1000));
        if (status.durationMillis) {
          setSessionDuration(Math.floor(status.durationMillis / 1000));
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
          stopWave();
          if (uid) {
            try {
              const { db } = await import('../lib/firebase');
              const { doc, updateDoc } = await import('firebase/firestore');
              if (db) {
                await updateDoc(doc(db, `users/${uid}/sessions/${today}`), { isListened: true });
              }
            } catch (err) {
              console.error('[HomeScreen] isListened update failed:', err);
            }
          }
        }
      }
    );
    soundRef.current = sound;
    setIsPlaying(true);
    startWave();
  }

  // Derived display values
  const currentMentorId = isDemoMode
    ? DEMO_SESSION.mentorId
    : (firestoreSession?.mentorId ?? activeMentorId);
  const mentor = DEMO_MENTORS.find((m) => m.id === currentMentorId) ?? DEMO_MENTORS[0];
  const sessionPrompt = isDemoMode ? DEMO_SESSION.prompt : (firestoreSession?.prompt ?? '');
  const coachingResponse = isDemoMode
    ? (elapsed >= DEMO_SESSION.durationSeconds ? DEMO_SESSION.arcResponse : null)
    : firestoreSession?.coachingResponse ?? null;
  const displayDuration = isDemoMode ? DEMO_SESSION.durationSeconds : sessionDuration;
  const progress = displayDuration > 0 ? Math.min(elapsed / displayDuration, 1) : 0;
  const sessionFinished = isDemoMode
    ? elapsed >= DEMO_SESSION.durationSeconds
    : (elapsed > 0 && elapsed >= sessionDuration && sessionDuration > 0);
  const hasAudioUrl = isDemoMode || !!firestoreSession?.audioUrl;
  const showSessionContent = isDemoMode || !!firestoreSession;
  const showLoadingState = !isDemoMode && (sessionLoading || (sessionGenerating && !firestoreSession));
  const sessionId = isDemoMode ? DEMO_SESSION.id : today;

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateLabel}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.sectionLabel}>Your daily session</Text>

        {/* Mentor row */}
        <View style={styles.mentorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{mentor.emoji}</Text>
          </View>
          <View style={styles.mentorInfo}>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorArchetype}>{mentor.archetype}</Text>
          </View>
        </View>

        {/* Loading / Generating state (real mode only) */}
        {showLoadingState && (
          <View style={styles.generatingCard}>
            <ActivityIndicator color="#7c3aed" style={{ marginBottom: 12 }} />
            <Text style={styles.generatingText}>
              {sessionGenerating ? '✨  Generating your session…' : 'Loading…'}
            </Text>
          </View>
        )}

        {showSessionContent && (
          <>
            {/* Prompt card */}
            {sessionPrompt ? (
              <View style={styles.promptCard}>
                <Text style={styles.promptQuote}>"{sessionPrompt}"</Text>
              </View>
            ) : (
              <View style={styles.generatingCard}>
                <ActivityIndicator color="#7c3aed" />
              </View>
            )}

            {/* Waveform */}
            <View style={styles.waveContainer} accessibilityLabel="Audio waveform">
              {waveAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 52],
                      }),
                      backgroundColor: isPlaying ? '#7c3aed' : '#2a2a3c',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Progress row */}
            <View style={styles.progressRow}>
              <Text style={styles.timeLabel}>{formatTime(elapsed)}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.timeLabel}>{formatTime(displayDuration)}</Text>
            </View>

            {/* Play/Pause */}
            {hasAudioUrl ? (
              <TouchableOpacity
                style={[styles.playButton, sessionFinished && styles.playButtonDone]}
                onPress={() => {
                  if (sessionFinished) return;
                  if (isDemoMode) {
                    setIsPlaying((p) => !p);
                  } else {
                    handlePlayReal();
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause session' : 'Play session'}
              >
                <Text style={styles.playIcon}>
                  {sessionFinished ? '✓' : isPlaying ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.generatingCard}>
                <ActivityIndicator color="#7c3aed" style={{ marginBottom: 8 }} />
                <Text style={styles.generatingText}>Preparing audio…</Text>
              </View>
            )}
          </>
        )}

        {/* Voice memo CTA */}
        <TouchableOpacity
          style={styles.voiceCta}
          onPress={() => navigation.navigate('VoiceMemoModal', { sessionId })}
          accessibilityRole="button"
          accessibilityLabel="Reply with a voice memo"
        >
          <Text style={styles.voiceCtaText}>🎙  Reply with Voice Memo</Text>
        </TouchableOpacity>

        {/* Arc response */}
        {coachingResponse ? (
          <View style={styles.arcCard}>
            <View style={styles.arcHeader}>
              <Text style={styles.arcAvatar}>{mentor.emoji}</Text>
              <Text style={styles.arcLabel}>{mentor.name} responded</Text>
            </View>
            <Text style={styles.arcText}>{coachingResponse}</Text>
          </View>
        ) : null}

        {/* Week 1 synthesis teaser */}
        <TouchableOpacity
          style={styles.synthTeaser}
          onPress={() => navigation.navigate('WeeklySynthesisModal')}
          accessibilityRole="button"
          accessibilityLabel="View Weekly Synthesis"
        >
          <Text style={styles.synthTeaserLabel}>Week 1 Synthesis</Text>
          <Text style={styles.synthTeaserBlurred}>Visibility · Systems thinking · ···</Text>
          <View style={styles.synthTeaserLockRow}>
            <Text style={styles.synthTeaserLock}>🔒  Unlock with Premium</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d0d12' },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  dateLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 24,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e1e2d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  avatarEmoji: { fontSize: 26 },
  mentorInfo: { flex: 1 },
  mentorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  mentorArchetype: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  generatingCard: {
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  generatingText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  promptCard: {
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  promptQuote: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    gap: 3,
    marginBottom: 16,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#2a2a3c',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 12,
    color: '#475569',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#1e1e2d',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 2,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7c3aed',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  playButtonDone: {
    backgroundColor: '#10b981',
  },
  playIcon: { fontSize: 24, color: '#fff' },
  voiceCta: {
    backgroundColor: '#161620',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3c',
    marginBottom: 28,
    minHeight: 52,
  },
  voiceCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a78bfa',
  },
  arcCard: {
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  arcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  arcAvatar: { fontSize: 18 },
  arcLabel: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arcText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  synthTeaser: {
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3c',
    overflow: 'hidden',
  },
  synthTeaserLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  synthTeaserBlurred: {
    fontSize: 15,
    color: '#1e1e2d',
    backgroundColor: '#1e1e2d',
    borderRadius: 4,
    marginBottom: 16,
    lineHeight: 22,
  },
  synthTeaserLockRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  synthTeaserLock: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '600',
  },
});
