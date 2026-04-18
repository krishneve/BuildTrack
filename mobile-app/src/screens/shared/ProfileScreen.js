import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logoutUser } from '../../store/slices/authSlice';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BTCard from '../../components/common/BTCard';
import BTButton from '../../components/common/BTButton';
import PageHeader from '../../components/common/PageHeader';
import { Colors, Typography, Spacing } from '../../theme';

const ROLE_LABELS = { admin: 'Administrator', site_manager: 'Site Manager', site_engineer: 'Site Engineer' };
const ROLE_COLORS = { admin: Colors.primary, site_manager: Colors.info, site_engineer: Colors.success };

export default function ProfileScreen() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const nav = useNavigation();

  const roleColor = ROLE_COLORS[user?.role] || Colors.textSecondary;

  return (
    <ScreenWrapper>
      <PageHeader title="Profile" showBack />

      <BTCard style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: `${roleColor}30`, borderColor: roleColor }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABELS[user?.role]}</Text>
        </View>
        {user?.designation && <Text style={styles.designation}>{user.designation}</Text>}
      </BTCard>

      <BTCard style={styles.infoCard}>
        {[
          { label: 'Email', value: user?.email },
          { label: 'Phone', value: user?.phone || 'Not set' },
          { label: 'Employee ID', value: user?.employeeId || 'Not assigned' },
        ].map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </BTCard>

      <BTButton
        label="Sign Out"
        variant="danger"
        size="lg"
        icon="⏻"
        onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
        ])}
        style={{ marginTop: Spacing.base }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  profileCard: { alignItems: 'center', paddingVertical: Spacing.xxl, marginBottom: Spacing.base, gap: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, marginBottom: 4 },
  avatarText: { fontSize: Typography.xxxl, fontWeight: '800' },
  name: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: Typography.sm, fontWeight: '700' },
  designation: { fontSize: Typography.sm, color: Colors.textMuted },
  infoCard: { gap: 0 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoLabel: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '500' },
  infoValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
});
