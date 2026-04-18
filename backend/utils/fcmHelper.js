// utils/fcmHelper.js
// Firebase Cloud Messaging — sends push notifications to mobile devices
// Uses firebase-admin SDK (server-side)
//
// Setup:
//   1. Go to Firebase Console → Project Settings → Service Accounts
//   2. Generate new private key (downloads a JSON file)
//   3. Set FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/key.json in .env
//      OR set FIREBASE_SERVICE_ACCOUNT_JSON=<json string> in .env

let admin;

const initFirebase = () => {
  if (admin) return admin;
  try {
    admin = require('firebase-admin');
    if (admin.apps.length > 0) return admin;

    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      credential = admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    } else {
      console.warn('[FCM] No Firebase credentials found. Push notifications disabled.');
      return null;
    }

    admin.initializeApp({ credential });
    console.log('✅ Firebase Admin initialized');
    return admin;
  } catch (err) {
    console.warn('[FCM] Firebase init failed:', err.message);
    return null;
  }
};

/**
 * Send push notification to a single FCM token
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendPush = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return { success: false, error: 'No FCM token' };

  const firebaseAdmin = initFirebase();
  if (!firebaseAdmin) return { success: false, error: 'Firebase not configured' };

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'buildtrack_alerts',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    };

    const messageId = await firebaseAdmin.messaging().send(message);
    return { success: true, messageId };
  } catch (err) {
    console.error('[FCM] Send failed:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send to multiple tokens (fan-out)
 * Returns array of results in same order as tokens
 */
const sendMulticast = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens?.length) return [];
  const firebaseAdmin = initFirebase();
  if (!firebaseAdmin) return fcmTokens.map(() => ({ success: false, error: 'Firebase not configured' }));

  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens: fcmTokens,
      android: { priority: 'high' },
    };
    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    return response.responses.map(r => ({
      success: r.success,
      messageId: r.messageId,
      error: r.error?.message,
    }));
  } catch (err) {
    return fcmTokens.map(() => ({ success: false, error: err.message }));
  }
};

module.exports = { sendPush, sendMulticast };
