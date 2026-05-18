import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.handle} />

        <Text style={styles.eyebrow}>PocketMentor Premium</Text>
        <Text style={styles.title}>Your career, coached daily.</Text>
        <Text style={styles.subtitle}>
          Unlock all mentors, weekly synthesis, and unlimited voice memos.
        </Text>

        <View style={styles.features}>
          <FeatureRow emoji="🌱" text="Maya Okafor — Human-First Strategist" />
          <FeatureRow emoji="⚡" text="James Navarro — Creative Disruptor (30-day streak)" />
          <FeatureRow emoji="📋" text="Weekly synthesis with themes + focus" />
          <FeatureRow emoji="🎙" text="Unlimited voice memo replies" />
          <FeatureRow emoji="📈" text="Full coaching arc history" />
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Subscribe to PocketMentor Premium for $9.99 per month"
        >
          <Text style={styles.purchaseButtonText}>Start Premium — $9.99/mo</Text>
          <Text style={styles.purchaseButtonSub}>Cancel anytime</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss paywall"
        >
          <Text style={styles.dismissButtonText}>Not now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d12',
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#2a2a3c',
    borderRadius: 2,
    marginBottom: 40,
  },
  eyebrow: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  features: {
    width: '100%',
    backgroundColor: '#161620',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2a2a3c',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureEmoji: { fontSize: 18 },
  featureText: { fontSize: 14, color: '#cbd5e1', flex: 1, lineHeight: 20 },
  purchaseButton: {
    width: '100%',
    backgroundColor: '#7c3aed',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  purchaseButtonSub: { color: '#c4b5fd', fontSize: 11, marginTop: 2 },
  dismissButton: {
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dismissButtonText: { color: '#475569', fontSize: 14 },
});
