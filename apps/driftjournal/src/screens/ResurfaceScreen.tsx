import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { demoResurfaced, demoClusters, formatRelativeTime } from '../lib/mockData';

export default function ResurfaceScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && <DemoBanner />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>✦ Daily Resurface</Text>
          <Text style={styles.headerDate}>{today}</Text>
          <Text style={styles.headerSubtitle}>
            Past thoughts the AI thinks are worth revisiting today.
          </Text>
        </View>

        {demoResurfaced.map(({ thought, relevanceScore, reason }) => {
          const cluster = demoClusters.find((c) => c.id === thought.clusterId);
          return (
            <View key={thought.id} style={styles.card}>
              <View style={styles.cardTop}>
                {cluster && (
                  <View style={[styles.clusterPill, { backgroundColor: cluster.bgColor }]}>
                    <Text style={styles.clusterPillEmoji}>{cluster.emoji}</Text>
                    <Text style={[styles.clusterPillText, { color: cluster.color }]}>
                      {cluster.name}
                    </Text>
                  </View>
                )}
                <Text style={styles.timeText}>{formatRelativeTime(thought.recordedAt)}</Text>
              </View>

              <Text style={styles.thoughtText}>{thought.text}</Text>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Why surfaced</Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>

              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${relevanceScore * 100}%` }]} />
              </View>
              <Text style={styles.scoreText}>
                {Math.round(relevanceScore * 100)}% relevance today
              </Text>
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            The Resurface engine is free for all users and always will be.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20 },

  header: { marginBottom: 24 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: '#6d28d9', letterSpacing: 0.8, marginBottom: 4 },
  headerDate: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 8 },
  headerSubtitle: { fontSize: 13, color: '#6b7280', lineHeight: 19 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clusterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clusterPillEmoji: { fontSize: 12 },
  clusterPillText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: '#9ca3af' },

  thoughtText: { fontSize: 15, color: '#1f2937', lineHeight: 22, marginBottom: 14 },

  reasonBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  reasonLabel: { fontSize: 10, fontWeight: '700', color: '#7c3aed', letterSpacing: 0.5, marginBottom: 4 },
  reasonText: { fontSize: 12, color: '#4b5563', lineHeight: 17 },

  scoreBar: {
    height: 3,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#6d28d9',
    borderRadius: 2,
  },
  scoreText: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },

  footer: {
    marginTop: 8,
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },
});
