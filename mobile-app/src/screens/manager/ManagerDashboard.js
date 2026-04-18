import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { logoutUser } from '../../store/slices/authSlice';
import { managerService } from '../../services/managerService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

// ─── Sub-components ──────────────────────────────────────────────────────────

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function KpiTile({ emoji, value, label, color, onPress, badge }) {
  return (
    <TouchableOpacity
      style={[styles.kpiTile, onPress && { borderColor: `${color}35` }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}>
        <Text style={styles.kpiEmoji}>{emoji}</Text>
        {badge > 0 && (
          <View style={styles.badgeDot}>
            <Text style={styles.badgeNum}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function BudgetBar({ spent, total, status }) {
  const pct = total ? Math.min((spent / total) * 100, 100) : 0;
  const barColor =
    status === 'overrun' ? Colors.danger :
    status === 'at_risk' ? Colors.warning : Colors.info;

  return (
    <View>
      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>Budget consumed</Text>
        <Text style={[styles.budgetPct, { color: barColor }]}>{pct.toFixed(1)}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.budgetAmounts}>
        <Text style={styles.budgetAmt}>Spent: ₹{(spent / 100000).toFixed(2)}L</Text>
        <Text style={styles.budgetAmt}>Total: ₹{(total / 100000).toFixed(2)}L</Text>
      </View>
    </View>
  );
}

function PendingBanner({ pending, onAttendance, onInvoices, onPayments }) {
  if (!pending || pending.total === 0) return null;
  return (
    <Card style={styles.pendingBanner}>
      <View style={styles.pendingTop}>
        <View style={styles.pendingLeft}>
          <Text style={styles.pendingDot}>●</Text>
          <Text style={styles.pendingTitle}>
            {pending.total} pending action{pending.total !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.pendingHint}>Tap to review</Text>
      </View>
      <View style={styles.pendingChips}>
        {pending.attendance > 0 && (
          <TouchableOpacity style={styles.pendingChip} onPress={onAttendance} activeOpacity={0.8}>
            <Text style={styles.pendingChipText}>✓ {pending.attendance} Attendance</Text>
          </TouchableOpacity>
        )}
        {pending.invoices > 0 && (
          <TouchableOpacity style={[styles.pendingChip, styles.pendingChipOrange]} onPress={onInvoices} activeOpacity={0.8}>
            <Text style={[styles.pendingChipText, { color: Colors.warning }]}>◻ {pending.invoices} Invoice{pending.invoices !== 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        )}
        {pending.payments > 0 && (
          <TouchableOpacity style={[styles.pendingChip, styles.pendingChipBlue]} onPress={onPayments} activeOpacity={0.8}>
            <Text style={[styles.pendingChipText, { color: Colors.info }]}>₹ {pending.payments} Payment{pending.payments !== 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const nav = useNavigation();
  const siteId = user?.primarySite;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    try {
      const res = await managerService.getDashboard(siteId);
      setData(res.data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [siteId]);

  // Reload every time tab is focused
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.info} size="large" />
        <Text style={styles.loaderText}>Loading site data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.info} />}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {greeting} 👋</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
          <Text style={styles.todayDate}>{today}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => Alert.alert('Sign Out', 'Logout from BuildTrack AI?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
          ])}
        >
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Site pill ── */}
      {data?.site && (
        <View style={styles.sitePill}>
          <View style={styles.siteDot} />
          <Text style={styles.siteName}>{data.site.name}</Text>
          <Text style={styles.siteProgress}>{data.site.progressPercent}% complete</Text>
        </View>
      )}

      {!data ? (
        <Card style={styles.noSiteCard}>
          <Text style={styles.noSiteTitle}>No site assigned</Text>
          <Text style={styles.noSiteSub}>Contact your admin to assign you to a site.</Text>
        </Card>
      ) : (
        <>
          {/* ── Pending approvals banner ── */}
          <PendingBanner
            pending={data.pending}
            onAttendance={() => nav.navigate('ApproveAttendance')}
            onInvoices={()   => nav.navigate('Invoices')}
            onPayments={()   => nav.navigate('Payments')}
          />

          {/* ── Today's KPIs ── */}
          <Text style={styles.sectionTitle}>TODAY</Text>
          <View style={styles.kpiGrid}>
            <KpiTile
              emoji="👷" color={Colors.success}
              value={data.today.checkedIn}
              label="Present"
              onPress={() => nav.navigate('Workers')}
            />
            <KpiTile
              emoji="✓" color={Colors.warning}
              value={data.pending.attendance}
              label="Pending Approval"
              badge={data.pending.attendance}
              onPress={() => nav.navigate('ApproveAttendance')}
            />
            <KpiTile
              emoji="⚠" color={data.lowStockCount > 0 ? Colors.danger : Colors.success}
              value={data.lowStockCount}
              label="Low Stock"
              onPress={() => nav.navigate('Materials')}
            />
            <KpiTile
              emoji="₹" color={Colors.info}
              value={`₹${(data.weeklySpend / 1000).toFixed(0)}K`}
              label="This Week Spend"
            />
          </View>

          {/* ── Budget card ── */}
          {data.budget && (
            <Card style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Site Budget</Text>
                <View style={[styles.budgetBadge, {
                  backgroundColor:
                    data.budget.status === 'overrun' ? Colors.dangerBg :
                    data.budget.status === 'at_risk' ? Colors.warningBg : Colors.infoBg
                }]}>
                  <Text style={[styles.budgetBadgeText, {
                    color:
                      data.budget.status === 'overrun' ? Colors.danger :
                      data.budget.status === 'at_risk' ? Colors.warning : Colors.info
                  }]}>
                    {data.budget.status === 'overrun' ? '🚨 OVERRUN' :
                     data.budget.status === 'at_risk'  ? '⚠ AT RISK'  : '✓ ON TRACK'}
                  </Text>
                </View>
              </View>
              <BudgetBar
                spent={data.budget.spent}
                total={data.budget.total}
                status={data.budget.status}
              />
            </Card>
          )}

          {/* ── Quick actions ── */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionRow}>
            <ActionButton label="Add Worker" emoji="+" color={Colors.success} onPress={() => nav.navigate('AddWorker')} />
            <ActionButton label="Log Material" emoji="▦" color={Colors.info} onPress={() => nav.navigate('LogMaterial')} />
            <ActionButton label="New Payment" emoji="₹" color={Colors.warning} onPress={() => nav.navigate('CreatePayment')} />
        <ActionButton label="AI Insights" emoji="🧠" color={Colors.primary} onPress={() => nav.navigate('AIInsights')} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ActionButton({ label, emoji, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { borderColor: `${color}35` }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.actionEmoji, { color }]}>{emoji}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: Spacing.base, paddingBottom: 100 },
  loader:  { flex: 1, backgroundColor: Colors.bgBase, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: Colors.textMuted, fontSize: Typography.sm },

  // Header
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  greeting:  { fontSize: Typography.sm, color: Colors.textMuted },
  userName:  { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary, lineHeight: 32 },
  todayDate: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: `${Colors.info}25`,
    borderWidth: 2, borderColor: Colors.info,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: Typography.lg, fontWeight: '800', color: Colors.info },

  // Site pill
  sitePill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.base, alignSelf: 'flex-start',
  },
  siteDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  siteName:    { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  siteProgress:{ fontSize: Typography.xs, color: Colors.textMuted, marginLeft: 4 },

  // Card
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, marginBottom: Spacing.sm,
  },

  // No site
  noSiteCard:  { alignItems: 'center', paddingVertical: 48 },
  noSiteTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textSecondary },
  noSiteSub:   { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },

  // Pending banner
  pendingBanner: { borderColor: `${Colors.success}35`, borderWidth: 1.5, marginBottom: Spacing.base },
  pendingTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  pendingLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingDot:    { fontSize: 10, color: Colors.success },
  pendingTitle:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  pendingHint:   { fontSize: Typography.xs, color: Colors.textMuted },
  pendingChips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pendingChip: {
    backgroundColor: `${Colors.success}15`, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: `${Colors.success}30`,
  },
  pendingChipOrange: { backgroundColor: `${Colors.warning}15`, borderColor: `${Colors.warning}30` },
  pendingChipBlue:   { backgroundColor: `${Colors.info}15`, borderColor: `${Colors.info}30` },
  pendingChipText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.success },

  // Section
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: '800', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },

  // KPI grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  kpiTile: {
    width: '47.5%', backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, alignItems: 'center', gap: 4,
  },
  kpiIcon:  { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2, position: 'relative' },
  kpiEmoji: { fontSize: 24 },
  kpiValue: { fontSize: Typography.xl, fontWeight: '800' },
  kpiLabel: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  badgeDot: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.danger, borderRadius: 10,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeNum: { fontSize: 9, fontWeight: '900', color: Colors.white },

  // Budget
  budgetCard:       { marginBottom: Spacing.base },
  budgetHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  budgetTitle:      { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  budgetBadge:      { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  budgetBadgeText:  { fontSize: Typography.xs, fontWeight: '700' },
  budgetRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel:      { fontSize: Typography.xs, color: Colors.textMuted },
  budgetPct:        { fontSize: Typography.xs, fontWeight: '700' },
  barTrack:         { height: 10, backgroundColor: Colors.bgInput, borderRadius: 5 },
  barFill:          { height: 10, borderRadius: 5 },
  budgetAmounts:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  budgetAmt:        { fontSize: Typography.xs, color: Colors.textMuted },

  // Actions
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  actionBtn: {
    flex: 1, backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.base, alignItems: 'center', gap: 6,
  },
  actionIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionEmoji: { fontSize: 20, fontWeight: '700' },
  actionLabel: { fontSize: Typography.xs, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
});
