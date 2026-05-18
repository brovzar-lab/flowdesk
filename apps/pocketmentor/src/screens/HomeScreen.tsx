import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DEMO_SESSION, DEMO_MENTORS } from '../data/demoContent';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const BAR_COUNT = 28;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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

  useEffect(() => {
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

  const progress = elapsed / DEMO_SESSION.durationSeconds;
  const mentor = DEMO_MENTORS.find((m) => m.id === DEMO_SESSION.mentorId)!;
  const sessionFinished = elapsed >= DEMO_SESSION.durationSeconds;

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

        {/* Prompt card */}
        <View style={styles.promptCard}>
          <Text style={styles.promptQuote}>"{DEMO_SESSION.prompt}"</Text>
        </View>

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
          <Text style={styles.timeLabel}>{formatTime(DEMO_SESSION.durationSeconds)}</Text>
        </View>

        {/* Play/Pause */}
        <TouchableOpacity
          style={[styles.playButton, sessionFinished && styles.playButtonDone]}
          onPress={() => !sessionFinished && setIsPlaying((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause session' : 'Play session'}
        >
          <Text style={styles.playIcon}>
            {sessionFinished ? '✓' : isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Voice memo CTA */}
        <TouchableOpacity
          style={styles.voiceCta}
          onPress={() =>
            navigation.navigate('VoiceMemoModal', { sessionId: DEMO_SESSION.id })
          }
          accessibilityRole="button"
          accessibilityLabel="Reply with a voice memo"
        >
          <Text style={styles.voiceCtaText}>🎙  Reply with Voice Memo</Text>
        </TouchableOpacity>

        {/* Arc response (shown after listening) */}
        {sessionFinished && (
          <View style={styles.arcCard}>
            <View style={styles.arcHeader}>
              <Text style={styles.arcAvatar}>{mentor.emoji}</Text>
              <Text style={styles.arcLabel}>{mentor.name} responded</Text>
            </View>
            <Text style={styles.arcText}>{DEMO_SESSION.arcResponse}</Text>
          </View>
        )}

        {/* Week 1 synthesis teaser — navigates to WeeklySynthesis screen */}
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
