import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../lib/firebase';
import { isDemoMode } from '../lib/demo';
import { usePantryAIStore } from '../lib/store';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const setUid = usePantryAIStore((s) => s.setUid);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUid(cred.user.uid);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    setUid('demo');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🥦</Text>
          <Text style={styles.logo}>PantryAI</Text>
          <Text style={styles.tagline}>Scan your fridge. Get a meal plan.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#4b5563"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#4b5563"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error !== null && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            style={styles.link}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account?{' '}
              <Text style={styles.linkAccent}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {isDemoMode && (
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleDemo}
            accessibilityRole="button"
            accessibilityLabel="Continue as Demo User"
          >
            <Text style={styles.demoBtnText}>Continue as Demo User</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    default:
      return 'Sign in failed. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070d07' },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoEmoji: { fontSize: 52, marginBottom: 8 },
  logo: { fontSize: 28, fontWeight: '700', color: '#f0fdf4', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#6b7280', marginTop: 6 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#0f1a0f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f0fdf4',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1a2d1a',
  },
  error: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  btn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { alignItems: 'center', paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkAccent: { color: '#22c55e', fontWeight: '600' },
  demoBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#1a2d1a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  demoBtnText: { color: '#86efac', fontSize: 15 },
});
