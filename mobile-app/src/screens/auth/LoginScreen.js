import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, Image, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import BTInput from '../../components/common/BTInput';
import BTButton from '../../components/common/BTButton';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Authentication Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }
    dispatch(loginUser({ email: email.trim().toLowerCase(), password }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Subtle Construction Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image 
          source={require('../../assets/bg_pattern.png')}
          style={styles.bgIcon}
          resizeMode="cover"
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Brand block */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>BT</Text>
          </View>
          <Text style={styles.appName}>BuildTrack AI</Text>
          <Text style={styles.tagline}>Future of Construction Tracking</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personnel Access</Text>
          <Text style={styles.cardSub}>Enter your credentials to continue</Text>

          <View style={styles.fields}>
            <BTInput
              label="Work Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="name@company.com"
            />
            <BTInput
              label="Secure Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
          </View>

          <BTButton
            label="Initialize Session"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginBtn}
          />

          {/* Quick fill for demo */}
          <View style={styles.demoRow}>
            <Text style={styles.demoLabel}>Demo Access:</Text>
            <TouchableOpacity onPress={() => { setEmail('amit@samarthdevelopers.com'); setPassword('Engineer@123'); }} style={styles.chipWrapper}>
              <Text style={styles.demoChip}>Engineer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEmail('rakesh@samarthdevelopers.com'); setPassword('Manager@123'); }} style={styles.chipWrapper}>
              <Text style={styles.demoChip}>Manager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>BuildTrack AI v1.0.4 · Enterprise Core</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  bgIcon: {
    width: '100%',
    height: '100%',
    opacity: 0.08,
    tintColor: Colors.primaryDark,
  },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: {
    width: 80, height: 80,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  logoText: { 
    fontSize: 28, 
    fontWeight: Typography.bold, 
    color: Colors.primaryDark,
    fontFamily: Typography.fontFamily,
  },
  appName: { 
    fontSize: Typography.xxl, 
    fontWeight: Typography.bold, 
    color: Colors.textPrimary, 
    letterSpacing: -0.8,
    fontFamily: Typography.fontFamily,
  },
  tagline: { 
    fontSize: Typography.sm, 
    color: Colors.textSecondary, 
    marginTop: 4,
    fontFamily: Typography.fontFamily,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  cardTitle: { 
    fontSize: Typography.lg, 
    fontWeight: Typography.bold, 
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
  },
  cardSub: { 
    fontSize: Typography.sm, 
    color: Colors.textSecondary, 
    marginTop: 4, 
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily,
  },
  fields: { marginBottom: Spacing.lg },
  loginBtn: { marginBottom: Spacing.lg },
  demoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  chipWrapper: { marginLeft: Spacing.sm },
  demoLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontFamily: Typography.fontFamily },
  demoChip: {
    fontSize: Typography.xs, 
    color: Colors.primaryDark,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, 
    fontWeight: Typography.semibold,
    overflow: 'hidden',
    fontFamily: Typography.fontFamily,
  },
  footer: { 
    textAlign: 'center', 
    fontSize: Typography.xs, 
    color: Colors.textSecondary, 
    marginTop: Spacing.xxl,
    fontFamily: Typography.fontFamily,
  },
});
