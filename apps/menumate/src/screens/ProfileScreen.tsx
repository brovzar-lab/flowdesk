import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';

const COMMON_ALLERGENS = [
  { id: 'peanut', label: 'Peanuts' },
  { id: 'gluten', label: 'Gluten / Wheat' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'dairy', label: 'Dairy / Milk' },
  { id: 'egg', label: 'Eggs' },
  { id: 'tree_nut', label: 'Tree Nuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'fish', label: 'Fish' },
];

const DIETARY_RESTRICTIONS = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export default function ProfileScreen() {
  const { profile, setAllergens, setDietaryRestrictions } = useStore();
  const [localAllergens, setLocalAllergens] = useState<string[]>(profile.allergens);
  const [localRestrictions, setLocalRestrictions] = useState<string[]>(profile.dietaryRestrictions);

  function toggleAllergen(id: string) {
    setLocalAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function toggleRestriction(id: string) {
    setLocalRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function handleSave() {
    setAllergens(localAllergens);
    setDietaryRestrictions(localRestrictions);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Select what you need to avoid. MenuMate will flag matching items in red.
        </Text>

        <Text style={styles.sectionHeading}>Allergens</Text>
        <View style={styles.section}>
          {COMMON_ALLERGENS.map((a) => {
            const selected = localAllergens.includes(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => toggleAllergen(a.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={a.label}
              >
                <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                  {a.label}
                </Text>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeading}>Dietary Restrictions</Text>
        <View style={styles.section}>
          {DIETARY_RESTRICTIONS.map((r) => {
            const selected = localRestrictions.includes(r.id);
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => toggleRestriction(r.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={r.label}
              >
                <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                  {r.label}
                </Text>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>

        {localAllergens.length > 0 && (
          <Text style={styles.hint}>
            {localAllergens.length} allergen{localAllergens.length > 1 ? 's' : ''} selected — go
            to Scan to test a menu.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  intro: { fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 20 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
    marginTop: 4,
  },
  section: { marginBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  rowLabel: { fontSize: 16, color: '#374151' },
  rowLabelSelected: { color: '#1d4ed8', fontWeight: '500' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
