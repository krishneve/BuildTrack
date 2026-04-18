// services/pushNotificationService.js
// Handles Firebase Cloud Messaging on the mobile client side

import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import api from './api';

/**
 * Request notification permission from the OS
 * Must be called early in app lifecycle (after login)
 */
export const requestPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    }
    // Android 13+ requires explicit permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const { check, request, PERMISSIONS, RESULTS } = require('react-native-permissions');
      const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
      return result === RESULTS.GRANTED;
    }
    return true; // Android < 13 — granted by default
  } catch (err) {
    console.warn('[Push] Permission request failed:', err.message);
    return false;
  }
};

/**
 * Get the FCM token for this device and register it with backend
 * Call after successful login
 */
export const registerFCMToken = async () => {
  try {
    const permitted = await requestPermission();
    if (!permitted) {
      console.log('[Push] Notification permission denied');
      return null;
    }

    const token = await messaging().getToken();
    if (!token) {
      console.log('[Push] No FCM token received');
      return null;
    }

    // Register with our backend
    await api.put('/auth/fcm-token', { fcmToken: token });
    console.log('[Push] FCM token registered');
    return token;
  } catch (err) {
    console.warn('[Push] FCM registration failed:', err.message);
    return null;
  }
};

/**
 * Set up foreground notification handler
 * Shows an in-app alert when a notification arrives while app is open
 */
export const setupForegroundHandler = (onNotification) => {
  return messaging().onMessage(async (remoteMessage) => {
    const { title, body } = remoteMessage.notification || {};
    const data = remoteMessage.data || {};

    console.log('[Push] Foreground notification:', title);

    if (onNotification) {
      onNotification({ title, body, data });
    } else {
      // Default: show alert
      Alert.alert(title || 'BuildTrack AI', body || '');
    }
  });
};

/**
 * Set up background/quit tap handler
 * Navigates to relevant screen when user taps a notification
 */
export const setupBackgroundHandler = () => {
  // Background message handler (required)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[Push] Background notification received:', remoteMessage.notification?.title);
  });
};

/**
 * Get initial notification (app opened from quit state via notification tap)
 */
export const getInitialNotification = async () => {
  return messaging().getInitialNotification();
};

/**
 * Listen for token refresh and re-register
 */
export const onTokenRefresh = () => {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      await api.put('/auth/fcm-token', { fcmToken: newToken });
      console.log('[Push] FCM token refreshed and re-registered');
    } catch (err) {
      console.warn('[Push] Token refresh registration failed:', err.message);
    }
  });
};
