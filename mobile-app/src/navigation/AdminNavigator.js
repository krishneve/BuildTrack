import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminMobileDashboard from '../screens/admin/AdminMobileDashboard';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminMobileDashboard} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
