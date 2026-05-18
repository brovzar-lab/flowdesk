import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DEMO_ARC_MESSAGES, DEMO_MENTORS } from '../data/demoContent';
import { isDemoMode } from '../lib/demo';
import { DemoBanner } from '../components/DemoBanner';
import type { ArcMessage } from '../lib/types';

type ArcNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const MENTOR_COLORS: Record<string, string> = {
  alex_chen: '#7c3aed',
  maya_okafor: '#10b981',
  james_navarro: '#f59e0b',
};

function SessionBubble({ msg }: { msg: ArcMessage }) {
  const mentor = msg.mentorId ? DEMO_MENTORS.find((m) => m.id === msg.mentorId) : null;
  const accentColor = msg.mentorId ? (MENTOR_COLORS[msg.mentorId] ?? '#7c3aed') : '#7c3aed';

  return (
    <View style={styles.sessionBubbleWrapper}>
      <View style={[styles.mentorDot, { backgroundColor: accentColor }]} />
      <View style={styles.sessionBubble}>
        <View style={styles.sessionHeader}>
          {mentor && (
            <Text style={[styles.sessionMentor, { color: accentColor }]}>{mentor.name}</Text>
          )}
          <Text style={styles.bubbleDate}>{msg.date}</Text>
        </View>
        <Text style={styles.sessionContent}>{msg.content}</Text>
      </View>
    </View>
  );
}

function ResponseBubble({ msg }: { msg: ArcMessage }) {
  return (
    <View style={styles.responseBubbleWrapper}>
      <View style={styles.responseBubble}>
        <View style={styles.sessionHeader}>
          <Text style={styles.responseLabel}>You</Text>
          <Text style={styles.bubbleDate}>{msg.date}</Text>
        </View>
        <Text style={styles.responseContent}>{msg.content}</Text>
      </View>
    </View>
  );
}

export default function CoachingArcScreen() {
  const navigation = useNavigation<ArcNavProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      {isDemoMode && <DemoBanner />}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Coaching Arc</Text>
        <Text style={styles.streak}>🔥 7-day streak</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {DEMO_ARC_MESSAGES.map((msg) => {
          if (msg.type === 'session') {
            return <SessionBubble key={msg.id} msg={msg} />;
          }
          return <ResponseBubble key={msg.id} msg={msg} />;
        })}

        {/* Reply CTA at the bottom */}
        <TouchableOpacity
          style={styles.replyCta}
          onPress={() => navigation.navigate('VoiceMemoModal', {})}
          accessibilityRole="button"
          accessibilityLabel="Add a voice memo reply"
        >
          <Text style={styles.replyCtaText}>🎙  Add Voice Memo Reply</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d0d12' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2d',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  streak: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  sessionBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  mentorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 14,
  },
  sessionBubble: {
    flex: 1,
    backgroundColor: '#161620',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionMentor: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bubbleDate: {
    fontSize: 11,
    color: '#334155',
  },
  sessionContent: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 21,
  },
  responseBubbleWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  responseBubble: {
    maxWidth: '82%',
    backgroundColor: '#1e1a2d',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3b2a5c',
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  responseContent: {
    fontSize: 14,
    color: '#ddd6fe',
    lineHeight: 21,
  },
  replyCta: {
    backgroundColor: '#161620',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3c',
    marginTop: 8,
    minHeight: 52,
  },
  replyCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a78bfa',
  },
});
