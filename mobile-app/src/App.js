// App.js — Root with FCM push notification setup
import React, { useEffect, useRef, useCallback } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { store } from './store';
import { restoreSession } from './store/slices/authSlice';
import { setConnected, setPendingCount } from './store/slices/networkSlice';
import { addToast } from './store/slices/toastSlice';
import RootNavigator from './navigation';
import { flushQueue, getQueueLength } from './services/offlineQueue';
import {
  registerFCMToken,
  setupForegroundHandler,
  setupBackgroundHandler,
  onTokenRefresh,
} from './services/pushNotificationService';

// Register background handler immediately (outside component tree)
setupBackgroundHandler();

function AppInner() {
  const dispatch  = useDispatch();
  const { user }  = useSelector(s => s.auth);
  const appState  = useRef(AppState.currentState);

  // ── Session restore on launch ──────────────────────────────────────────────
  useEffect(() => {
    dispatch(restoreSession());
  }, []);

  // ── Register FCM token when user logs in ───────────────────────────────────
  useEffect(() => {
    if (!user) return;
    registerFCMToken();
    const unsubRefresh = onTokenRefresh();
    return () => unsubRefresh();
  }, [user?._id]);

  // ── Foreground push notification handler ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = setupForegroundHandler(({ title, body, data }) => {
      // Show toast instead of Alert when app is in foreground
      dispatch(addToast({ title, message: body, type: data?.type || 'system' }));
    });
    return () => unsub();
  }, [user?._id]);

  // ── Network monitor + offline queue sync ──────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener(async (state) => {
      dispatch(setConnected(state.isConnected));
      if (state.isConnected) {
        const { synced } = await flushQueue();
        if (synced > 0) {
          dispatch(addToast({ title: '✓ Synced', message: `${synced} offline action(s) uploaded`, type: 'system' }));
        }
      }
      const pending = await getQueueLength();
      dispatch(setPendingCount(pending));
    });
    return () => unsub();
  }, []);

  // ── Sync queue when app comes to foreground ────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          const { synced } = await flushQueue();
          if (synced > 0) {
            dispatch(addToast({ title: '✓ Synced', message: `${synced} offline entries uploaded`, type: 'system' }));
          }
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return <RootNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
}
