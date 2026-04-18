import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { logoutUser } from '../../store/slices/authSlice';
import { engineerService } from '../../services/engineerService';
import ToastContainer from '../../components/common/ToastContainer';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';

// ─── Sub-components ──────────────────────────────────────────────────────────

function AttendanceBanner({ today }) {
  const nav = useNavigation();
  if (!today) return null;

  const checkedIn  = today.checkedIn;
  const checkedOut = today.checkedOut;

  let color, icon, label, sub;
  if (checkedOut) {
    color = Colors.success; icon = '✓✓';
    label = 'Checked In & Out'; sub = 'Attendance complete for today';
  } else if (checkedIn) {
    color = Colors.warning; icon = '→';
    label = 'Checked In';
    sub = today.checkInStatus === 'approved' ? 'Approved by manager' : 'Awaiting approval';
  } else {
    color = Colors.danger; icon = '!';
    label = 'Not Checked In';
    sub = 'Tap to mark attendance now';
  }

  return (
    <TouchableOpacity
      style={[styles.attBanner, { borderLeftColor: color }]}
      onPress={() => nav.navigate('Attendance')}
      activeOpacity={0.85}
    >
      <View style={[styles.attIcon, { backgroundColor: `${color}20` }]}>
        <Text style={[styles.attIconText, { color }]}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.attLabel, { color }]}>{label}</Text>
        <Text style={styles.attSub}>{sub}</Text>
      </View>
      <Text style={[styles.attArrow, { color }]}>›</Text>
    </TouchableOpacity>
  );
}

function StatRow({ stats, onPress }) {
  const items = [
    { label: 'Materials\nLogged', value: stats?.materialLogs || 0, color: Colors.info,    onPress: () => onPress('Materials') },
    { label: 'Invoices\nManaged',  value: stats?.invoicesUploaded || 0, color: Colors.primary, onPress: () => onPress('Invoices') },
    { label: 'Stock\nAlerts',    value: stats?.stock?.lowStockCount || 0, color: stats?.stock?.lowStockCount > 0 ? Colors.danger : Colors.success, onPress: () => onPress('Materials') },
  ];
  return (
    <View style={styles.statRow}>
      {items.map((item, i) => (
        <TouchableOpacity key={i} style={styles.statTile} onPress={item.onPress} activeOpacity={0.8}>
          <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ActionButton({ emoji, label, color, onPress, badge }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { borderColor: `${color}30` }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIconWrap, { backgroundColor: `${color}15` }]}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
        {badge > 0 && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RecentLog({ log }) {
  const isIn   = log.type === 'in';
  const timeStr = new Date(log.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return (
    <View style={styles.logRow}>
      <View style={[styles.logTypePill, { backgroundColor: isIn ? `${Colors.success}20` : `${Colors.danger}20` }]}>
        <Text style={[styles.logTypeTxt, { color: isIn ? Colors.success : Colors.danger }]}>
          {isIn ? '↓' : '↑'} {log.type.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.logMat} numberOfLines={1}>{log.material}</Text>
      <Text style={styles.logQty}>{log.quantity} {log.unit}</Text>
      <Text style={styles.logTime}>{timeStr}</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function EngineerDashboard() {
  const { user }  = useSelector(s => s.auth);
  const dispatch  = useDispatch();
  const nav       = useNavigation();
  const siteId    = user?.primarySite;

  const [home,       setHome]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHome = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    try {
      const { data } = await engineerService.getHome(siteId);
      setHome(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [siteId]);

  useFocusEffect(useCallback(() => { loadHome(); }, [loadHome]));

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const handleLogout = () => Alert.alert(
    'Sign Out', 'Logout from BuildTrack AI?',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) }]
  );

  return (
    <ScreenWrapper refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHome(); }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgBase} />
      <ToastContainer />
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {greeting} 🪖</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0] || 'Engineer'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellWrap} onPress={() => nav.navigate('Notifications')} activeOpacity={0.8}>
              <Text style={styles.bellEmoji}>🔔</Text>
              {home?.unreadNotifications > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellCount}>
                    {home.unreadNotifications > 9 ? '9+' : home.unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.avatarTxt}>{user?.name?.charAt(0).toUpperCase() || 'E'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SITE PILL ── */}
        {home?.site && (
          <View style={styles.sitePill}>
            <View style={styles.siteDot} />
            <Text style={styles.siteName} numberOfLines={1}>{home.site.name}</Text>
            <Text style={styles.siteCity}>{home.site.city}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.engineer} size="large" />
            <Text style={styles.loadingTxt}>Loading site data...</Text>
          </View>
        ) : !siteId ? (
          <View style={styles.noSiteCard}>
            <Text style={styles.noSiteEmoji}>🏗</Text>
            <Text style={styles.noSiteTitle}>No Site Assigned</Text>
            <Text style={styles.noSiteSub}>Contact your manager to get assigned to a site.</Text>
          </View>
        ) : (
          <>
            {/* ── ATTENDANCE BANNER ── */}
            <AttendanceBanner today={home?.today} />

            {/* ── TODAY STATS ── */}
            <StatRow stats={home?.today} onPress={(screen) => nav.navigate(screen)} />

            {/* ── LOW STOCK WARNING ── */}
            {home?.stock?.lowStockCount > 0 && (
              <TouchableOpacity
                style={styles.lowStockBanner}
                onPress={() => nav.navigate('Materials')}
                activeOpacity={0.85}
              >
                <Text style={styles.lowStockEmoji}>⚠</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lowStockTitle}>
                    {home.stock.lowStockCount} material{home.stock.lowStockCount !== 1 ? 's' : ''} below minimum
                  </Text>
                  <Text style={styles.lowStockSub}>
                    {home.stock.lowStockItems.slice(0, 2).map(m => `${m.name}: ${m.currentStock} ${m.unit}`).join(' · ')}
                  </Text>
                </View>
                <Text style={styles.lowStockArrow}>›</Text>
              </TouchableOpacity>
            )}

            {/* ── QUICK ACTIONS ── */}
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.actionsGrid}>
              <ActionButton emoji="✓"  label="Mark Attendance" color={Colors.success}  onPress={() => nav.navigate('Attendance')} />
              <ActionButton emoji="⬇"  label="Material IN"     color={Colors.info}     onPress={() => nav.navigate('MaterialLog', { defaultType: 'in' })} />
              <ActionButton emoji="⬆"  label="Material OUT"    color={Colors.warning}  onPress={() => nav.navigate('MaterialLog', { defaultType: 'out' })} />
              <ActionButton emoji="◎"  label="Upload Invoice"  color={Colors.primary}  onPress={() => nav.navigate('InvoiceUpload')} />
            </View>

            {/* ── RECENT ACTIVITY ── */}
            {home?.recentLogs?.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>TODAY'S LOGS</Text>
                  <TouchableOpacity onPress={() => nav.navigate('Materials')}>
                    <Text style={styles.seeAll}>See all →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.logsCard}>
                  {home.recentLogs.map((log, i) => (
                    <View key={i}>
                      <RecentLog log={log} />
                      {i < home.recentLogs.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll:     { padding: Spacing.base, paddingBottom: 110 },
  loadingWrap:{ alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingTxt: { fontSize: Typography.sm, color: Colors.textMuted },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  greeting:      { fontSize: Typography.sm, color: Colors.textMuted },
  name:          { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary, lineHeight: 32 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bellWrap:      { position: 'relative', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  bellEmoji:     { fontSize: 22 },
  bellBadge:     { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  bellCount:     { fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
  avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, ...Shadow.sm, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:     { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.primaryDark },

  // Site pill
  sitePill:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: Radius.full, paddingVertical: 8, paddingHorizontal: 16, marginBottom: Spacing.lg, alignSelf: 'flex-start', maxWidth: '100%', ...Shadow.sm },
  siteDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, flexShrink: 0 },
  siteName:    { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily },
  siteCity:    { fontSize: Typography.xs, color: Colors.textSecondary, fontFamily: Typography.fontFamily },

  // No site
  noSiteCard:  { alignItems: 'center', paddingVertical: 64, gap: 12 },
  noSiteEmoji: { fontSize: 52 },
  noSiteTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textSecondary },
  noSiteSub:   { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  // Attendance banner
  attBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md, ...Shadow.md },
  attIcon:      { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  attIconText:  { fontSize: 18, fontWeight: Typography.bold },
  attLabel:     { fontSize: Typography.base, fontWeight: Typography.semibold, fontFamily: Typography.fontFamily },
  attSub:       { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, fontFamily: Typography.fontFamily },
  attArrow:     { fontSize: 24, fontWeight: '300', color: Colors.textMuted },

  // Stats
  statRow:      { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statTile:     { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center', gap: 4, ...Shadow.md },
  statValue:    { fontSize: Typography.xl, fontWeight: Typography.bold, fontFamily: Typography.fontFamily },
  statLabel:    { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16, fontFamily: Typography.fontFamily },

  // Low stock
  lowStockBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${Colors.danger}10`, borderRadius: Radius.lg, borderWidth: 1, borderColor: `${Colors.danger}30`, padding: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.sm },
  lowStockEmoji:  { fontSize: 22, flexShrink: 0 },
  lowStockTitle:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.danger },
  lowStockSub:    { fontSize: Typography.xs, color: `${Colors.danger}AA`, marginTop: 2 },
  lowStockArrow:  { fontSize: 22, color: Colors.danger },

  // Actions
  sectionLabel:  { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.md, fontFamily: Typography.fontFamily },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll:        { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: Typography.semibold, fontFamily: Typography.fontFamily },
  actionsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  actionBtn:     { width: '47.3%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm, ...Shadow.md },
  actionIconWrap:{ width: 56, height: 56, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  actionEmoji:   { fontSize: 26 },
  actionBadge:   { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.danger, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
  actionBadgeText:{ fontSize: 10, fontWeight: Typography.bold, color: Colors.white },
  actionLabel:   { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: 'center', fontFamily: Typography.fontFamily },

  // Logs
  logsCard:  { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md },
  logRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.base, gap: Spacing.sm },
  logTypePill:{ borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  logTypeTxt: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 0.5 },
  logMat:    { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary, fontFamily: Typography.fontFamily },
  logQty:    { fontSize: Typography.xs, color: Colors.textSecondary, fontFamily: Typography.fontFamily },
  logTime:   { fontSize: Typography.xs, color: Colors.textMuted, width: 55, textAlign: 'right', fontFamily: Typography.fontFamily },
  divider:   { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.base },
});
