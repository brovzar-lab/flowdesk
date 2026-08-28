import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import ProfileScreen from '../screens/ProfileScreen';
import ScanScreen from '../screens/ScanScreen';
import ResultsScreen from '../screens/ResultsScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Results: { menuId: string };
};

export type MainTabParamList = {
  Profile: undefined;
  Scan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Allergens',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          title: 'Scan Menu',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📷" focused={focused} />,
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
        name="Results"
        component={ResultsScreen}
        options={{ title: 'Menu Results', headerBackTitle: 'Scan' }}
      />
    </Stack.Navigator>
  );
}
