import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { usePocketMentorStore } from '../lib/store';
import { PaywallModal } from '../components/PaywallModal';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CoachingArcScreen from '../screens/CoachingArcScreen';
import PersonaSelectorScreen from '../screens/PersonaSelectorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VoiceMemoScreen from '../screens/VoiceMemoScreen';
import WeeklySynthesisScreen from '../screens/WeeklySynthesisScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  VoiceMemoModal: { sessionId?: string };
  WeeklySynthesisModal: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Arc: undefined;
  Personas: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d12',
          borderTopColor: '#1e1e2d',
          paddingBottom: 4,
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎙" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Arc"
        component={CoachingArcScreen}
        options={{
          tabBarLabel: 'Arc',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Personas"
        component={PersonaSelectorScreen}
        options={{
          tabBarLabel: 'Mentors',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const hasCompletedOnboarding = usePocketMentorStore((s) => s.hasCompletedOnboarding);
  const paywallVisible = usePocketMentorStore((s) => s.paywallVisible);
  const setPaywallVisible = usePocketMentorStore((s) => s.setPaywallVisible);

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="VoiceMemoModal"
              component={VoiceMemoScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="WeeklySynthesisModal"
              component={WeeklySynthesisScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </>
  );
}
