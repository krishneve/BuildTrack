import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { managerService } from '../../services/managerService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const TYPE_LABEL = {
  weekly_labor: 'Weekly Labor', monthly_salary: 'Monthly Salary',
  advance: 'Advance', contractor: 'Contractor', other: 'Other',
};
const TRADE_EMOJI = {
  mason:'🧱', carpenter:'🪵', electrician:'⚡', plumber:'🔧',
  welder:'🔥', helper:'👷', painter:'🎨', supervisor:'📋', driver:'🚗', other:'👤',
};

function SectionCard({ title, children, accent }) {
  return (
    <View style={[styles.section, accent && { borderLeftWidth: 3, borderLeftColor: accent }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: Colors.primary, fontWeight: '700' }]}>
        {value}
      </Text>
    </View>
  );
}

function BarItem({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.barItem}>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barVal, { color }]}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const { user } = useSelector(s => s.auth);
  const siteId = user?.primarySite;

  const [data, setData]         = useState(null);
  const [prod, setProd]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    try {
      const [rRes, pRes] = await Promise.all([
        managerService.getSiteSummary(siteId),
        managerService.getProductivity(siteId, 7),
      ]);
      setData(rRes.data.data);
      setProd(pRes.data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [siteId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.info} size="large" />
        <Text style={styles.loadingTxt}>Generating report...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDataTxt}>No report data available</Text>
      </View>
    );
  }

  const maxTrade = data.workers?.byTrade
    ? Math.max(...Object.values(data.workers.byTrade), 1)
    : 1;
  const maxPayType = data.payments?.byType
    ? Math.max(...data.payments.byType.map(t => t.amount), 1)
    : 1;
  const avgPresent = prod?.avgPresent || 0;
  const maxTimeline = prod?.timeline?.length
    ? Math.max(...prod.timeline.map(d => d.checkedIn), 1)
    : 1;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.info} />}
    >
      {/* ── Site header ── */}
      <View style={styles.reportHeader}>
        <Text style={styles.siteName}>{data.site?.name}</Text>
        <Text style={styles.reportDate}>
          Report as of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        {data.site?.progress != null && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${data.site.progress}%` }]} />
            </View>
            <Text style={styles.progressTxt}>{data.site.progress}% complete</Text>
          </View>
        )}
      </View>

      {/* ── Budget ── */}
      {data.budget && (
        <SectionCard title="💰 Budget Overview" accent={Colors.info}>
          <Row label="Total Budget"   value={`₹${(data.budget.total / 100000).toFixed(2)}L`} />
          <Row label="Total Spent"    value={`₹${(data.budget.spent / 100000).toFixed(2)}L`} highlight />
          <Row label="Remaining"      value={`₹${((data.budget.total - data.budget.spent) / 100000).toFixed(2)}L`} />
          <Row label="Consumed"       value={`${data.budget.pct}%`} highlight={data.budget.pct > 80} />
          <View style={styles.budgetBar}>
            <View style={[styles.budgetFill, {
              width: `${Math.min(data.budget.pct, 100)}%`,
              backgroundColor: data.budget.pct >= 100 ? Colors.danger : data.budget.pct >= 80 ? Colors.warning : Colors.success,
            }]} />
          </View>
        </SectionCard>
      )}

      {/* ── Workers ── */}
      <SectionCard title="👷 Workforce" accent={Colors.success}>
        <Row label="Total Active Workers" value={data.workers?.total || 0} highlight />
        {data.workers?.byTrade && Object.keys(data.workers.byTrade).length > 0 && (
          <View style={styles.tradeBreakdown}>
            <Text style={styles.subTitle}>By Trade</Text>
            {Object.entries(data.workers.byTrade).map(([trade, count]) => (
              <BarItem
                key={trade}
                label={`${TRADE_EMOJI[trade] || '👤'} ${trade.charAt(0).toUpperCase() + trade.slice(1)}`}
                value={count}
                max={maxTrade}
                color={Colors.success}
              />
            ))}
          </View>
        )}
      </SectionCard>

      {/* ── Worker productivity ── */}
      {prod && prod.timeline?.length > 0 && (
        <SectionCard title="📈 Attendance (Last 7 Days)" accent={Colors.primary}>
          <Row label="Average Daily Presence" value={`${avgPresent} workers`} highlight />
          <View style={styles.tradeBreakdown}>
            {prod.timeline.map((day, i) => (
              <BarItem
                key={i}
                label={day.date}
                value={day.checkedIn}
                max={maxTimeline}
                color={Colors.primary}
              />
            ))}
          </View>
        </SectionCard>
      )}

      {/* ── Materials ── */}
      <SectionCard title="▦ Materials & Inventory" accent={Colors.warning}>
        <Row label="Total Items" value={data.materials?.totalItems || 0} />
        <Row label="Low Stock Alerts" value={data.materials?.lowStockCount || 0} highlight={data.materials?.lowStockCount > 0} />
        <Row label="Total Stock Value" value={`₹${Number(data.materials?.stockValue || 0).toLocaleString('en-IN')}`} highlight />
        {data.materials?.lowStockItems?.length > 0 && (
          <View style={styles.lowStockList}>
            <Text style={styles.subTitle}>⚠ Low Stock Items</Text>
            {data.materials.lowStockItems.map(m => (
              <View key={m._id} style={styles.lowItem}>
                <Text style={styles.lowItemName}>{m.name}</Text>
                <Text style={styles.lowItemStock}>{m.currentStock} {m.unit} (min: {m.minThreshold})</Text>
              </View>
            ))}
          </View>
        )}
      </SectionCard>

      {/* ── Payments ── */}
      <SectionCard title="₹ Payments" accent={Colors.info}>
        <Row label="Total Approved" value={data.payments?.totalApproved || 0} />
        <Row label="Total Paid Out" value={`₹${Number(data.payments?.totalAmount || 0).toLocaleString('en-IN')}`} highlight />
        {data.payments?.byType?.filter(t => t.amount > 0).length > 0 && (
          <View style={styles.tradeBreakdown}>
            <Text style={styles.subTitle}>By Type</Text>
            {data.payments.byType.filter(t => t.amount > 0).map(t => (
              <BarItem
                key={t.type}
                label={TYPE_LABEL[t.type] || t.type}
                value={`₹${(t.amount/1000).toFixed(0)}K`}
                max={maxPayType}
                color={Colors.info}
              />
            ))}
          </View>
        )}
      </SectionCard>

      {/* ── Invoices ── */}
      <SectionCard title="◻ Invoices" accent={Colors.danger}>
        <Row label="Total Invoices"   value={data.invoices?.total || 0} />
        <Row label="Approved"         value={data.invoices?.approved || 0} />
        <Row label="Approved Value"   value={`₹${Number(data.invoices?.approvedAmount || 0).toLocaleString('en-IN')}`} highlight />
      </SectionCard>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: Colors.bgBase },
  content:   { padding: Spacing.base },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt:{ color: Colors.textMuted, fontSize: Typography.sm },
  noDataTxt: { color: Colors.textMuted, fontSize: Typography.base },

  reportHeader: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, marginBottom: Spacing.base,
  },
  siteName:    { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  reportDate:  { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.sm },
  progressWrap:{ gap: 6 },
  progressTrack:{ height: 8, backgroundColor: Colors.bgInput, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.info },
  progressTxt:  { fontSize: Typography.xs, color: Colors.info, fontWeight: '600' },

  section: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subTitle: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  rowLabel:  { fontSize: Typography.sm, color: Colors.textSecondary },
  rowValue:  { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600' },

  budgetBar: { height: 8, backgroundColor: Colors.bgInput, borderRadius: 4, marginTop: Spacing.sm },
  budgetFill:{ height: 8, borderRadius: 4 },

  tradeBreakdown: { marginTop: Spacing.sm },
  barItem:   { marginBottom: Spacing.sm },
  barRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel:  { fontSize: Typography.xs, color: Colors.textSecondary },
  barVal:    { fontSize: Typography.xs, fontWeight: '700' },
  barTrack:  { height: 6, backgroundColor: Colors.bgInput, borderRadius: 3 },
  barFill:   { height: 6, borderRadius: 3 },

  lowStockList: { marginTop: Spacing.sm },
  lowItem:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  lowItemName:  { fontSize: Typography.sm, color: Colors.textPrimary },
  lowItemStock: { fontSize: Typography.xs, color: Colors.danger, fontWeight: '600' },
});
