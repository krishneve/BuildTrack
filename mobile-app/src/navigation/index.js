// navigation/index.js
// Role-based root navigator — shows the right stack based on logged-in role

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../theme';

import AuthNavigator from './AuthNavigator';
import EngineerNavigator from './EngineerNavigator';
import ManagerNavigator from './ManagerNavigator';
import AdminNavigator from './AdminNavigator';

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, sessionRestored } = useSelector((state) => state.auth);

  if (!sessionRestored) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgBase, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const getNavigator = () => {
    if (!user) return <AuthNavigator />;
    switch (user.role) {
      case 'admin':        return <AdminNavigator />;
      case 'site_manager': return <ManagerNavigator />;
      case 'site_engineer':
      default:             return <EngineerNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
}
