import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { engineerService } from '../../services/engineerService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const STATUS_CFG = {
  pending:  { color: Colors.warning, bg: Colors.warningBg, label: '⏳ PENDING'  },
  approved: { color: Colors.success, bg: Colors.successBg, label: '✅ APPROVED' },
  rejected: { color: Colors.danger,  bg: Colors.dangerBg,  label: '❌ REJECTED'  },
  paid:     { color: Colors.info,    bg: Colors.infoBg,    label: '💵 PAID'       },
};

function InvoiceCard({ item }) {
  const cfg     = STATUS_CFG[item.status] || STATUS_CFG.pending;
  const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.invNo}>
            {item.invoiceNumber ? `#${item.invoiceNumber}` : `INV-${item._id.slice(-6).toUpperCase()}`}
          </Text>
          <Text style={styles.supplier}>{item.supplierName}</Text>
          <Text style={styles.catLabel}>{item.category} · {dateStr}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>₹{Number(item.totalAmount || item.amount || 0).toLocaleString('en-IN')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
      {item.notes && <Text style={styles.noteTxt} numberOfLines={1}>📝 {item.notes}</Text>}
      {item.remarks && (
        <View style={styles.remarksBox}>
          <Text style={styles.remarksTxt}>Manager: {item.remarks}</Text>
        </View>
      )}
    </View>
  );
}

export default function InvoicesScreen() {
  const { user }  = useSelector(s => s.auth);
  const nav       = useNavigation();
  const siteId    = user?.primarySite;

  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const loadInvoices = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await engineerService.getMyInvoices(siteId);
      setInvoices(data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [siteId]);

  useFocusEffect(useCallback(() => { loadInvoices(); }, [loadInvoices]));

  const pendingCount = invoices.filter(i => i.status === 'pending').length;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Invoices</Text>
          {pendingCount > 0 && <Text style={styles.subtitle}>{pendingCount} awaiting approval</Text>}
        </View>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => nav.navigate('InvoiceUpload')}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadBtnTxt}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.engineer} size="large" /></View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>◎</Text>
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySub}>Tap "+ Upload" to submit your first invoice</Text>
            </View>
          }
          renderItem={({ item }) => <InvoiceCard item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bgBase },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingTop: Spacing.lg },
  title:    { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, fontFamily: Typography.fontFamily },
  subtitle: { fontSize: Typography.xs, color: Colors.warning, fontWeight: Typography.semibold, marginTop: 2, fontFamily: Typography.fontFamily },
  uploadBtn:{ backgroundColor: Colors.primaryDark, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 10, ...Shadow.sm },
  uploadBtnTxt:{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.white, fontFamily: Typography.fontFamily },

  list:   { padding: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyWrap:  { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textSecondary, fontFamily: Typography.fontFamily },
  emptySub:   { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 8, textAlign: 'center', fontFamily: Typography.fontFamily },

  card:     { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.base, ...Shadow.md },
  cardRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, paddingRight: Spacing.sm },
  invNo:    { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.primaryDark, fontVariant: ['tabular-nums'], marginBottom: 4, fontFamily: Typography.fontFamily },
  supplier: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, fontFamily: Typography.fontFamily },
  catLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize', fontFamily: Typography.fontFamily },
  cardRight:{ alignItems: 'flex-end', gap: 8 },
  amount:   { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, fontFamily: Typography.fontFamily },
  statusBadge: { borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:   { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 0.5 },
  noteTxt:  { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.md, fontStyle: 'italic', fontFamily: Typography.fontFamily },
  remarksBox:  { backgroundColor: Colors.bgInput, borderRadius: Radius.sm, padding: 10, marginTop: Spacing.md },
  remarksTxt:  { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic', fontFamily: Typography.fontFamily },
});
