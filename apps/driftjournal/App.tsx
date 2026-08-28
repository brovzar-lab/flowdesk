import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/lib/store';

function ToastOverlay() {
  const toastMessage = useStore((s) => s.toastMessage);
  const clearToast = useStore((s) => s.clearToast);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <Text style={styles.toastText}>{toastMessage}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <ToastOverlay />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    zIndex: 999,
  },
  toastText: { color: '#f8f8f8', fontSize: 14, fontWeight: '500' },
});
