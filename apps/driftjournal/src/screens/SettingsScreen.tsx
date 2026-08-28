import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { useStore } from '../lib/store';
import { demoClusters } from '../lib/mockData';

const FREE_DAILY_LIMIT = 10;

export default function SettingsScreen() {
  const dailyCaptureCount = useStore((s) => s.dailyCaptureCount);
  const showToast = useStore((s) => s.showToast);
  const totalThoughts = demoClusters.reduce((sum, c) => sum + c.thoughts.length, 0);

  function handleUpgrade() {
    if (isDemoMode) {
      showToast('Demo mode — upgrade flow not available');
    }
  }

  const usedPct = Math.min(dailyCaptureCount / FREE_DAILY_LIMIT, 1);
  const remaining = Math.max(FREE_DAILY_LIMIT - dailyCaptureCount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && <DemoBanner />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>DriftJournal Premium</Text>
            <Text style={styles.premiumPrice}>$4.99/mo</Text>
          </View>
          <Text style={styles.premiumSubtitle}>
            Unlock unlimited captures. All AI features stay free forever.
          </Text>
          <View style={styles.premiumFeatures}>
            <Text style={styles.feature}>✓  Unlimited daily voice captures</Text>
            <Text style={styles.featureFree}>✓  AI theme clustering — always free</Text>
            <Text style={styles.featureFree}>✓  Daily resurface engine — always free</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Premium"
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Usage</Text>
          <View style={styles.usageCard}>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Captures today</Text>
              <Text style={styles.usageValue}>
                {dailyCaptureCount} / {FREE_DAILY_LIMIT}
              </Text>
            </View>
            <View style={styles.usageBar}>
              <View
                style={[
                  styles.usageBarFill,
                  {
                    width: `${usedPct * 100}%`,
                    backgroundColor: usedPct >= 1 ? '#ef4444' : '#6d28d9',
                  },
                ]}
              />
            </View>
            <Text style={styles.usageHint}>
              {remaining > 0
                ? `${remaining} capture${remaining !== 1 ? 's' : ''} remaining today`
                : 'Daily limit reached — upgrade for unlimited'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalThoughts}</Text>
              <Text style={styles.statLabel}>Total thoughts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{demoClusters.length}</Text>
              <Text style={styles.statLabel}>Clusters</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountCard}>
            {isDemoMode ? (
              <View style={styles.demoAccountRow}>
                <Text style={styles.demoAccountEmoji}>👤</Text>
                <View>
                  <Text style={styles.demoAccountName}>Demo User</Text>
                  <Text style={styles.demoAccountEmail}>demo@driftjournal.app</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.signInPrompt}>Sign in to sync your thoughts across devices.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>DriftJournal v1.0.0</Text>
            <Text style={styles.aboutText}>Made with 🎙️ by Lemaa</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20, gap: 24 },

  premiumCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  premiumTitle: { fontSize: 18, fontWeight: '800', color: '#f8f8f8' },
  premiumPrice: { fontSize: 14, fontWeight: '600', color: '#a78bfa' },
  premiumSubtitle: { fontSize: 13, color: '#a78bfa', lineHeight: 18 },
  premiumFeatures: { gap: 6 },
  feature: { fontSize: 13, color: '#f8f8f8', fontWeight: '500' },
  featureFree: { fontSize: 13, color: '#6d9f71', fontWeight: '500' },
  upgradeButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 48,
  },
  upgradeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { gap: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  usageValue: { fontSize: 14, color: '#6d28d9', fontWeight: '700' },
  usageBar: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 3 },
  usageHint: { fontSize: 11, color: '#9ca3af' },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },

  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  demoAccountRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  demoAccountEmoji: { fontSize: 36 },
  demoAccountName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  demoAccountEmail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  signInPrompt: { fontSize: 13, color: '#6b7280', lineHeight: 19 },

  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  aboutText: { fontSize: 13, color: '#6b7280' },
});
