import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { aiService } from '../../services/aiService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const SEV_CFG = {
  critical: { color: Colors.danger,  bg: `${Colors.danger}15`,  icon: '🚨', border: `${Colors.danger}35` },
  high:     { color: '#F97316',       bg: '#F9731615',           icon: '⚠',  border: '#F9731635' },
  medium:   { color: Colors.warning, bg: `${Colors.warning}15`, icon: '⚡', border: `${Colors.warning}35` },
  low:      { color: Colors.info,    bg: `${Colors.info}15`,    icon: 'ℹ', border: `${Colors.info}35` },
  info:     { color: Colors.textMuted, bg: Colors.bgCard, icon: '●', border: Colors.border },
};

function AlertCard({ alert }) {
  const cfg = SEV_CFG[alert.severity] || SEV_CFG.info;
  return (
    <View style={[styles.alertCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={styles.alertRow}>
        <Text style={styles.alertIcon}>{cfg.icon}</Text>
        <View style={styles.alertContent}>
          <View style={styles.alertTitleRow}>
            <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
            <View style={[styles.alertBadge, { backgroundColor: `${cfg.color}25` }]}>
              <Text style={[styles.alertBadgeTxt, { color: cfg.color }]}>
                {alert.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.alertMsg}>{alert.message}</Text>
        </View>
      </View>
    </View>
  );
}

function ForecastItem({ pred }) {
  const risk_color = {
    critical: Colors.danger, high: '#F97316',
    medium: Colors.warning, low: Colors.engineer,
  };
  const color = risk_color[pred.stockRisk] || Colors.engineer;
  const pct   = Math.min((pred.daysOfStockLeft / 30) * 100, 100);

  return (
    <View style={styles.forecastItem}>
      <View style={styles.forecastHeader}>
        <Text style={styles.forecastName} numberOfLines={1}>{pred.materialName}</Text>
        <View style={[styles.riskBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.riskBadgeTxt, { color }]}>{pred.stockRisk.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.forecastBar}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.daysLeft}>
          {pred.daysOfStockLeft === 999 ? '30+ days' : `${pred.daysOfStockLeft}d`}
        </Text>
      </View>
      <View style={styles.forecastMeta}>
        <Text style={styles.metaTxt}>Stock: {pred.currentStock} {pred.unit}</Text>
        <Text style={styles.metaTxt}>Avg: {pred.avgDailyUsage}/day</Text>
        <Text style={[styles.metaTxt, { color: pred.trend === 'increasing' ? Colors.danger : pred.trend === 'decreasing' ? Colors.success : Colors.textMuted }]}>
          {pred.trend === 'increasing' ? '↑' : pred.trend === 'decreasing' ? '↓' : '→'} {pred.trend}
        </Text>
      </View>
    </View>
  );
}

function CostCard({ cost }) {
  const riskColor = {
    critical: Colors.danger, high: '#F97316',
    medium: Colors.warning, low: Colors.success,
  };
  const color = riskColor[cost.riskLevel] || Colors.success;
  const pct = Math.min(cost.budget.pctConsumed, 100);

  return (
    <View style={[styles.costCard, { borderColor: `${color}30` }]}>
      <View style={styles.costHeader}>
        <Text style={styles.costTitle}>Cost Risk</Text>
        <View style={[styles.riskBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.riskBadgeTxt, { color }]}>{cost.riskLevel.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.costBudgetRow}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.costPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.costStats}>
        {[
          { label: 'Spent', val: `₹${(cost.budget.spent / 100000).toFixed(2)}L` },
          { label: 'Total', val: `₹${(cost.budget.total / 100000).toFixed(2)}L` },
          { label: 'Rate',  val: `₹${cost.spending.dailyRate7d.toLocaleString()}/day` },
        ].map(r => (
          <View key={r.label} style={styles.costStat}>
            <Text style={styles.costStatVal}>{r.val}</Text>
            <Text style={styles.costStatLbl}>{r.label}</Text>
          </View>
        ))}
      </View>
      {cost.projections.budgetExhaustionDate && (
        <View style={styles.exhaustionBox}>
          <Text style={styles.exhaustionTxt}>
            ⚠ Budget may run out: {cost.projections.budgetExhaustionDate}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function AIInsightsScreen() {
  const { user }  = useSelector(s => s.auth);
  const siteId    = user?.primarySite;

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiOnline,   setAiOnline]   = useState(null);

  const loadData = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    try {
      const { data: res } = await aiService.getDashboard(siteId);
      setData(res.data);
      setAiOnline(res.data?.aiStatus === 'online');
    } catch {
      setAiOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [siteId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const alerts   = data?.alerts?.alerts    || [];
  const forecast = data?.forecast?.predictions || [];
  const cost     = data?.costRisk;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🧠 AI Insights</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: aiOnline === null ? Colors.textMuted : aiOnline ? Colors.success : Colors.danger }]} />
          <Text style={styles.statusTxt}>AI {aiOnline === null ? '...' : aiOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      {/* AI Offline */}
      {aiOnline === false && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTitle}>🔌 AI Service Offline</Text>
          <Text style={styles.offlineSub}>Run: cd ai-service && uvicorn main:app --reload</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingTxt}>Loading AI insights...</Text>
        </View>
      ) : (
        <>
          {/* Alerts */}
          <Text style={styles.sectionLabel}>SMART ALERTS ({alerts.length})</Text>
          {alerts.length === 0 ? (
            <View style={styles.allClearCard}>
              <Text style={styles.allClearEmoji}>✅</Text>
              <Text style={styles.allClearTitle}>All Clear</Text>
              <Text style={styles.allClearSub}>No AI alerts for your site</Text>
            </View>
          ) : (
            <View style={styles.sectionContent}>
              {alerts.map((alert, i) => <AlertCard key={i} alert={alert} />)}
            </View>
          )}

          {/* Cost Risk */}
          {cost && (
            <>
              <Text style={styles.sectionLabel}>COST RISK ANALYSIS</Text>
              <CostCard cost={cost} />
            </>
          )}

          {/* Material Forecast */}
          {forecast.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>MATERIAL DEMAND (7-DAY FORECAST)</Text>
              <View style={styles.forecastCard}>
                {forecast.map((pred, i) => (
                  <View key={i}>
                    <ForecastItem pred={pred} />
                    {i < forecast.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: Spacing.base, paddingBottom: 100 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  title:   { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: '600' },

  offlineBanner: { backgroundColor: `${Colors.warning}15`, borderRadius: Radius.lg, borderWidth: 1, borderColor: `${Colors.warning}35`, padding: Spacing.base, marginBottom: Spacing.base },
  offlineTitle:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.warning },
  offlineSub:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4, fontFamily: 'monospace' },

  center:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingTxt: { color: Colors.textMuted, fontSize: Typography.sm },

  sectionLabel:  { fontSize: Typography.xs, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  sectionContent:{ gap: Spacing.sm },

  allClearCard:  { backgroundColor: `${Colors.success}12`, borderRadius: Radius.lg, borderWidth: 1, borderColor: `${Colors.success}30`, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.sm },
  allClearEmoji: { fontSize: 36, marginBottom: 8 },
  allClearTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.success },
  allClearSub:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },

  alertCard:    { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.sm },
  alertRow:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  alertIcon:    { fontSize: 20, flexShrink: 0, marginTop: 1 },
  alertContent: { flex: 1 },
  alertTitleRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 },
  alertTitle:   { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  alertBadge:   { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  alertBadgeTxt:{ fontSize: 9, fontWeight: '800' },
  alertMsg:     { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },

  costCard:     { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.sm },
  costHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  costTitle:    { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  costBudgetRow:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  costPct:      { fontSize: Typography.sm, fontWeight: '700', width: 36, textAlign: 'right' },
  costStats:    { flexDirection: 'row', justifyContent: 'space-between' },
  costStat:     { alignItems: 'center' },
  costStatVal:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  costStatLbl:  { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  exhaustionBox:{ backgroundColor: `${Colors.danger}10`, borderRadius: Radius.sm, padding: Spacing.sm, marginTop: Spacing.sm },
  exhaustionTxt:{ fontSize: Typography.xs, color: Colors.danger, fontWeight: '600', textAlign: 'center' },

  riskBadge:    { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  riskBadgeTxt: { fontSize: 9, fontWeight: '800' },

  forecastCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.sm },
  forecastItem: { padding: Spacing.base },
  forecastHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  forecastName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  forecastBar:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  barTrack:     { flex: 1, height: 6, backgroundColor: Colors.bgInput, borderRadius: 3 },
  barFill:      { height: 6, borderRadius: 3 },
  daysLeft:     { fontSize: Typography.xs, color: Colors.textMuted, width: 48, textAlign: 'right' },
  forecastMeta: { flexDirection: 'row', gap: Spacing.base },
  metaTxt:      { fontSize: Typography.xs, color: Colors.textMuted },
  divider:      { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.base },
});
