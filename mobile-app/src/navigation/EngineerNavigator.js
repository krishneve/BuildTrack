import AIInsightsScreen from '../screens/shared/AIInsightsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Colors } from '../theme';

import EngineerDashboard   from '../screens/engineer/EngineerDashboard';
import AttendanceScreen    from '../screens/engineer/AttendanceScreen';
import MaterialsScreen     from '../screens/engineer/MaterialsScreen';
import MaterialLogScreen   from '../screens/engineer/MaterialLogScreen';
import InvoicesScreen      from '../screens/engineer/InvoicesScreen';
import InvoiceUploadScreen from '../screens/engineer/InvoiceUploadScreen';
import ProfileScreen       from '../screens/shared/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused, badge }) {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
      {badge > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: Colors.danger, borderRadius: 8,
          minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
        }}>
          <Text style={{ fontSize: 8, fontWeight: '900', color: Colors.white }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

function TabLabel({ label, focused }) {
  return (
    <Text style={{
      fontSize: 10, fontWeight: focused ? '700' : '500',
      color: focused ? Colors.engineer : Colors.textMuted,
      marginBottom: 2,
    }}>
      {label}
    </Text>
  );
}

function EngineerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   Colors.engineer,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tab.Screen name="Dashboard"  component={EngineerDashboard}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⬡" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} /> }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✓" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Attendance" focused={focused} /> }} />
      <Tab.Screen name="Materials"  component={MaterialsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="▦" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Materials" focused={focused} /> }} />
      <Tab.Screen name="Invoices"   component={InvoicesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="◎" focused={focused} />, tabBarLabel: ({ focused }) => <TabLabel label="Invoices" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function EngineerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="EngineerTabs"   component={EngineerTabs} />
      <Stack.Screen name="MaterialLog"    component={MaterialLogScreen} />
      <Stack.Screen name="InvoiceUpload"  component={InvoiceUploadScreen} />
      <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="Profile"        component={ProfileScreen} />
    </Stack.Navigator>
  );
}
