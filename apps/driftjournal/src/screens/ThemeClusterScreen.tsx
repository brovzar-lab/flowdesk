import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { getClusterById, formatRelativeTime } from '../lib/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeCluster'>;

export default function ThemeClusterScreen() {
  const route = useRoute<Props['route']>();
  const { clusterId } = route.params;
  const cluster = getClusterById(clusterId);

  if (!cluster) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Cluster not found.</Text>
      </SafeAreaView>
    );
  }

  const avgConfidence = (
    cluster.thoughts.reduce((sum, t) => sum + t.clusterConfidence, 0) / cluster.thoughts.length
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && <DemoBanner />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.clusterHero, { backgroundColor: cluster.bgColor }]}>
          <Text style={styles.heroEmoji}>{cluster.emoji}</Text>
          <Text style={[styles.heroName, { color: cluster.color }]}>{cluster.name}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: cluster.color }]}>
                {cluster.thoughts.length}
              </Text>
              <Text style={styles.heroStatLabel}>thoughts</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: cluster.color }]}>
                {Math.round(avgConfidence * 100)}%
              </Text>
              <Text style={styles.heroStatLabel}>AI confidence</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cluster Map</Text>
          <View style={styles.mapGrid}>
            {cluster.thoughts.map((thought) => (
              <View
                key={thought.id}
                style={[
                  styles.mapNode,
                  {
                    borderColor: cluster.color,
                    backgroundColor: cluster.bgColor,
                    width: `${40 + thought.clusterConfidence * 20}%`,
                  },
                ]}
              >
                <View style={styles.mapNodeHeader}>
                  <View
                    style={[
                      styles.confidenceDot,
                      {
                        backgroundColor: cluster.color,
                        opacity: thought.clusterConfidence,
                      },
                    ]}
                  />
                  <Text style={[styles.confidenceLabel, { color: cluster.color }]}>
                    {Math.round(thought.clusterConfidence * 100)}%
                  </Text>
                </View>
                <Text style={styles.mapNodeText} numberOfLines={2}>
                  {thought.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Thoughts</Text>
          {cluster.thoughts.map((thought) => (
            <View key={thought.id} style={styles.thoughtCard}>
              <Text style={styles.thoughtText}>{thought.text}</Text>
              <View style={styles.thoughtFooter}>
                <Text style={styles.thoughtTime}>{formatRelativeTime(thought.recordedAt)}</Text>
                <View style={[styles.confidencePill, { backgroundColor: cluster.bgColor }]}>
                  <Text style={[styles.confidencePillText, { color: cluster.color }]}>
                    {Math.round(thought.clusterConfidence * 100)}% match
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  errorText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 40 },
  content: { paddingBottom: 40 },

  clusterHero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  heroEmoji: { fontSize: 48, marginBottom: 10 },
  heroName: { fontSize: 26, fontWeight: '800', marginBottom: 20 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 28, fontWeight: '700' },
  heroStatLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  heroStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.1)' },

  section: { padding: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mapNode: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minWidth: '40%',
  },
  mapNodeHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  confidenceDot: { width: 6, height: 6, borderRadius: 3 },
  confidenceLabel: { fontSize: 10, fontWeight: '700' },
  mapNodeText: { fontSize: 12, color: '#374151', lineHeight: 17 },

  thoughtCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  thoughtText: { fontSize: 14, color: '#1f2937', lineHeight: 21 },
  thoughtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  thoughtTime: { fontSize: 11, color: '#9ca3af' },
  confidencePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confidencePillText: { fontSize: 10, fontWeight: '700' },
});
