import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DemoBanner } from '../components/DemoBanner';
import { TrafficLightBadge } from '../components/TrafficLightBadge';
import { flagAllergens } from '../lib/allergens';
import { sampleMenus } from '../lib/mockData';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/demo';
import type { FlaggedMenuItem } from '../lib/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ route }: Props) {
  const { menuId } = route.params;
  const profile = useStore((s) => s.profile);

  const selectedMenu = sampleMenus.find((m) => m.id === menuId);
  const flaggedItems: FlaggedMenuItem[] = selectedMenu
    ? flagAllergens(selectedMenu.menu, profile.allergens)
    : [];

  const dangerCount = flaggedItems.filter((i) => i.status === 'danger').length;
  const warningCount = flaggedItems.filter((i) => i.status === 'warning').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && <DemoBanner />}
      <FlatList
        data={flaggedItems}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              {item.matchedAllergens.length > 0 && (
                <Text style={styles.matchedAllergens}>
                  Contains: {item.matchedAllergens.join(', ')}
                </Text>
              )}
            </View>
            <TrafficLightBadge status={item.status} />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.menuName}>{selectedMenu?.name ?? 'Menu'}</Text>
            {profile.allergens.length === 0 ? (
              <View style={styles.noAllergenBanner}>
                <Text style={styles.noAllergenText}>
                  ℹ️ No allergens set — all items show as safe. Go to Profile to add your
                  allergens.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.allergenNote}>
                  Checking for: {profile.allergens.join(', ')}
                </Text>
                {(dangerCount > 0 || warningCount > 0) && (
                  <View style={styles.summaryRow}>
                    {dangerCount > 0 && (
                      <Text style={styles.dangerSummary}>🔴 {dangerCount} to avoid</Text>
                    )}
                    {warningCount > 0 && (
                      <Text style={styles.warningSummary}>🟡 {warningCount} to check</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ Results are indicative only. Always inform restaurant staff of your allergies.
              MenuMate is not a substitute for professional medical or dietary advice.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16 },
  header: { marginBottom: 16 },
  menuName: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  allergenNote: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  dangerSummary: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  warningSummary: { fontSize: 13, color: '#d97706', fontWeight: '600' },
  noAllergenBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  noAllergenText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  itemDescription: { fontSize: 13, color: '#6b7280', marginTop: 2, lineHeight: 18 },
  matchedAllergens: { fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: '600' },
  disclaimer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  disclaimerText: { fontSize: 12, color: '#92400e', lineHeight: 18 },
});
