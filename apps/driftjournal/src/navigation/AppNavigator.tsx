import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CaptureScreen from '../screens/CaptureScreen';
import ThemeClusterScreen from '../screens/ThemeClusterScreen';
import ResurfaceScreen from '../screens/ResurfaceScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Capture: undefined;
  ThemeCluster: { clusterId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Resurface: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6d28d9',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4, borderTopColor: '#f3f4f6' },
        headerStyle: { backgroundColor: '#fafafa' },
        headerTitleStyle: { color: '#1f2937', fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'DriftJournal',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Resurface"
        component={ResurfaceScreen}
        options={{
          title: 'Resurface',
          tabBarLabel: 'Resurface',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          title: 'New Thought',
          presentation: 'modal',
          headerStyle: { backgroundColor: '#0f0e17' },
          headerTitleStyle: { color: '#f8f8f8', fontWeight: '700' },
          headerTintColor: '#a78bfa',
        }}
      />
      <Stack.Screen
        name="ThemeCluster"
        component={ThemeClusterScreen}
        options={{
          title: 'Cluster',
          headerStyle: { backgroundColor: '#fafafa' },
          headerTitleStyle: { color: '#1f2937', fontWeight: '700' },
          headerBackTitle: 'Home',
        }}
      />
    </Stack.Navigator>
  );
}
