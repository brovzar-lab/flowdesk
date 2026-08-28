import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { DemoBanner } from '../components/DemoBanner';
import { isDemoMode } from '../lib/demo';
import { sampleMenus } from '../lib/mockData';

type ScanNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Scan'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function ScanScreen() {
  const navigation = useNavigation<ScanNavProp>();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isDemoMode && <DemoBanner />}

      <View style={styles.content}>
        <View
          style={styles.viewfinder}
          accessibilityLabel="Camera viewfinder placeholder"
        >
          <Text style={styles.cameraEmoji}>📷</Text>
          <Text style={styles.viewfinderLabel}>Camera viewfinder</Text>
          <Text style={styles.viewfinderSub}>
            {isDemoMode
              ? 'Demo mode — choose a sample menu below'
              : 'Point camera at a restaurant menu and tap Scan'}
          </Text>
        </View>

        {isDemoMode ? (
          <View>
            <Text style={styles.demoPickerLabel}>Choose a demo menu to preview</Text>
            {sampleMenus.map((menu) => (
              <TouchableOpacity
                key={menu.id}
                style={styles.menuButton}
                onPress={() => navigation.navigate('Results', { menuId: menu.id })}
                accessibilityRole="button"
                accessibilityLabel={`Select ${menu.name}, ${menu.menu.length} items`}
              >
                <View>
                  <Text style={styles.menuButtonName}>{menu.name}</Text>
                  <Text style={styles.menuButtonMeta}>{menu.menu.length} menu items</Text>
                </View>
                <Text style={styles.menuButtonArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.scanButton}
            accessibilityRole="button"
            accessibilityLabel="Tap to scan menu"
          >
            <Text style={styles.scanButtonText}>Tap to Scan Menu</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  viewfinder: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  cameraEmoji: { fontSize: 48, marginBottom: 12 },
  viewfinderLabel: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  viewfinderSub: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  demoPickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    minHeight: 64,
  },
  menuButtonName: { fontSize: 16, fontWeight: '600', color: '#1d4ed8' },
  menuButtonMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  menuButtonArrow: { fontSize: 22, color: '#93c5fd' },
  scanButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
  },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
