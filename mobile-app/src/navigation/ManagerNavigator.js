import AIInsightsScreen from '../screens/shared/AIInsightsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Colors } from '../theme';

// Tab screens
import ManagerDashboard     from '../screens/manager/ManagerDashboard';
import WorkersScreen        from '../screens/manager/WorkersScreen';
import ManagerMaterialsScreen from '../screens/manager/ManagerMaterialsScreen';
import PaymentsScreen       from '../screens/manager/PaymentsScreen';
import ReportsScreen        from '../screens/manager/ReportsScreen';

// Stack-only screens
import ApproveAttendanceScreen from '../screens/manager/ApproveAttendanceScreen';
import ProfileScreen        from '../screens/shared/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab bar icon ─────────────────────────────────────────────────────────────
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
      color: focused ? Colors.info : Colors.textMuted,
      marginBottom: 2,
    }}>
      {label}
    </Text>
  );
}

function ManagerTabs() {
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
        tabBarActiveTintColor:   Colors.info,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ManagerDashboard}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="◈" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Workers"
        component={WorkersScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👷" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Workers" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Materials"
        component={ManagerMaterialsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="▦" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Materials" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="₹" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Payments" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="◉" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Reports" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function ManagerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerTabs"       component={ManagerTabs} />
      <Stack.Screen name="ApproveAttendance" component={ApproveAttendanceScreen} />
      <Stack.Screen name="Invoices"          component={PaymentsScreen} />  {/* Shares Payments UX for invoices */}
      <Stack.Screen name="LogMaterial"       component={ManagerMaterialsScreen} />
      <Stack.Screen name="CreatePayment"     component={PaymentsScreen} />
      <Stack.Screen name="AddWorker"         component={WorkersScreen} />
      <Stack.Screen name="Profile"           component={ProfileScreen} />
    </Stack.Navigator>
  );
}
