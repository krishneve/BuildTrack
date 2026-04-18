import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BTCard from '../../components/common/BTCard';
import { dashboardService } from '../../services/dashboardService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function AdminMobileDashboard() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.adminOverview()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text style={styles.roleLabel}>Admin — Mobile View</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Logout', 'Sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
          ])}
          style={styles.avatarBtn}
        >
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <BTCard style={styles.noteCard}>
        <Text style={styles.noteIcon}>💻</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.noteTitle}>Full Admin Controls on Web</Text>
          <Text style={styles.noteSub}>Site management, budgets, and user management are available on the web dashboard.</Text>
        </View>
      </BTCard>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : data ? (
        <>
          <Text style={styles.sectionTitle}>Company Overview</Text>
          <View style={styles.kpiGrid}>
            {[
              { label: 'Active Sites', value: data.totalSites || 0, emoji: '⬡' },
              { label: 'Total Workers', value: data.totalWorkers || 0, emoji: '◉' },
              { label: 'Avg Progress', value: `${data.averageProgress || 0}%`, emoji: '◈' },
              { label: 'Total Spent', value: data.totalSpent ? `₹${(data.totalSpent / 100000).toFixed(1)}L` : '₹0', emoji: '₹' },
            ].map((kpi) => (
              <BTCard key={kpi.label} style={styles.kpiCard}>
                <Text style={styles.kpiEmoji}>{kpi.emoji}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </BTCard>
            ))}
          </View>
        </>
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  roleLabel: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${Colors.primary}30`, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.primary },
  avatarText: { fontSize: Typography.md, fontWeight: '700', color: Colors.primary },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.lg, borderColor: `${Colors.primary}40`, backgroundColor: `${Colors.primary}10` },
  noteIcon: { fontSize: 24 },
  noteTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  noteSub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard: { width: '47.5%', alignItems: 'center', paddingVertical: Spacing.base, gap: 4 },
  kpiEmoji: { fontSize: 22 },
  kpiValue: { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary },
  kpiLabel: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
});
