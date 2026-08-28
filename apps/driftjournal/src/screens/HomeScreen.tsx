import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { demoClusters, formatRelativeTime } from '../lib/mockData';
import type { ThemeCluster } from '../lib/types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

function ClusterSection({ cluster }: { cluster: ThemeCluster }) {
  const navigation = useNavigation<HomeNavProp>();
  const preview = cluster.thoughts.slice(0, 2);

  return (
    <View style={styles.clusterSection}>
      <TouchableOpacity
        style={styles.clusterHeader}
        onPress={() => navigation.navigate('ThemeCluster', { clusterId: cluster.id })}
        accessibilityRole="button"
        accessibilityLabel={`View ${cluster.name} cluster`}
      >
        <View style={[styles.clusterBadge, { backgroundColor: cluster.bgColor }]}>
          <Text style={styles.clusterEmoji}>{cluster.emoji}</Text>
          <Text style={[styles.clusterName, { color: cluster.color }]}>{cluster.name}</Text>
          <Text style={[styles.clusterCount, { color: cluster.color }]}>
            {cluster.thoughts.length}
          </Text>
        </View>
        <Text style={styles.seeAll}>See all ›</Text>
      </TouchableOpacity>

      {preview.map((thought) => (
        <View key={thought.id} style={styles.thoughtCard}>
          <Text style={styles.thoughtText} numberOfLines={2}>
            {thought.text}
          </Text>
          <View style={styles.thoughtMeta}>
            <Text style={styles.thoughtTime}>{formatRelativeTime(thought.recordedAt)}</Text>
            <Text style={styles.thoughtDuration}>{thought.duration}s</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && <DemoBanner />}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.captureHint}>Tap 🎙️ to capture a thought</Text>
        </View>

        {demoClusters.map((cluster) => (
          <ClusterSection key={cluster.id} cluster={cluster} />
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Capture')}
        accessibilityRole="button"
        accessibilityLabel="Capture a new voice thought"
      >
        <Text style={styles.fabEmoji}>🎙️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  dateHeader: { marginBottom: 20 },
  dateText: { fontSize: 13, fontWeight: '600', color: '#6b7280', letterSpacing: 0.2 },
  captureHint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  clusterSection: { marginBottom: 24 },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clusterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  clusterEmoji: { fontSize: 14 },
  clusterName: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  clusterCount: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  seeAll: { fontSize: 13, color: '#6d28d9', fontWeight: '500' },

  thoughtCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  thoughtText: { fontSize: 14, color: '#1f2937', lineHeight: 20 },
  thoughtMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  thoughtTime: { fontSize: 11, color: '#9ca3af' },
  thoughtDuration: { fontSize: 11, color: '#9ca3af' },

  bottomSpacer: { height: 100 },

  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6d28d9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabEmoji: { fontSize: 26 },
});
