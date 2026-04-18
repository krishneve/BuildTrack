import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, ScrollView, TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { paymentService } from '../../services/paymentService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const TYPE_LABEL = {
  weekly_labor: 'Weekly Labor', monthly_salary: 'Monthly Salary',
  advance: 'Advance', contractor: 'Contractor', bonus: 'Bonus', other: 'Other',
};
const STATUS_CONFIG = {
  pending:  { color: Colors.warning, bg: `${Colors.warning}18`, label: 'PENDING' },
  approved: { color: Colors.success, bg: `${Colors.success}18`, label: 'APPROVED' },
  rejected: { color: Colors.danger,  bg: `${Colors.danger}18`,  label: 'REJECTED' },
  paid:     { color: Colors.info,    bg: `${Colors.info}18`,    label: 'PAID' },
};

function PaymentCard({ item, onApprove, onReject, onMarkPaid, processing }) {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const isProcessing = processing === item._id;

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardLeft}>
          <View style={[styles.typeIcon, { backgroundColor: `${Colors.info}18` }]}>
            <Text style={{ fontSize: 22 }}>₹</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.payeeName}>{item.payeeName}</Text>
            <Text style={styles.payeeType}>{TYPE_LABEL[item.type] || item.type}</Text>
            {item.period && <Text style={styles.period}>{item.period}</Text>}
            <Text style={styles.methodLabel}>{item.method?.replace('_', ' ')?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={styles.dateStr}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.noteRow}>
          <Text style={styles.noteText}>📝 {item.notes}</Text>
        </View>
      )}
      {item.reason && (
        <View style={[styles.noteRow, { backgroundColor: `${Colors.danger}10` }]}>
          <Text style={[styles.noteText, { color: Colors.danger }]}>✕ {item.reason}</Text>
        </View>
      )}

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isProcessing && styles.btnOff]}
            onPress={() => onReject(item)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectText}>✕ Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, isProcessing && styles.btnOff]}
            onPress={() => onApprove(item._id)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.approveText}>✓ Approve</Text>
            }
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'approved' && (
        <TouchableOpacity
          style={[styles.paidBtn, isProcessing && styles.btnOff]}
          onPress={() => onMarkPaid(item._id)}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.paidBtnText}>💵 Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CreatePaymentModal({ visible, siteId, onClose, onSaved }) {
  const [form, setForm] = useState({
    payeeName: '', payeeType: 'worker', type: 'weekly_labor',
    amount: '', period: '', method: 'cash', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.payeeName.trim()) { Alert.alert('Required', 'Payee name is required'); return; }
    if (!form.amount || isNaN(form.amount)) { Alert.alert('Required', 'Enter valid amount'); return; }
    setSaving(true);
    try {
      await paymentService.create({ ...form, siteId, amount: Number(form.amount) });
      Alert.alert('Created', 'Payment record created and pending approval.');
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, ...props }) => (
    <View style={{ marginBottom: Spacing.base }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={Colors.textMuted} {...props} />
    </View>
  );

  const Seg = ({ label, options, value, onChange }) => (
    <View style={{ marginBottom: Spacing.base }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            style={[styles.segBtn, value === o.value && styles.segBtnActive]}
            onPress={() => onChange(o.value)}
          >
            <Text style={[styles.segText, value === o.value && styles.segTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Payment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1, padding: Spacing.base }} keyboardShouldPersistTaps="handled">
          <Field label="Payee Name *" value={form.payeeName} onChangeText={v => set('payeeName', v)} placeholder="e.g. Ramesh Kumar" />
          <Field label="Amount (₹) *" value={form.amount} onChangeText={v => set('amount', v)} keyboardType="numeric" placeholder="5000" />
          <Field label="Period" value={form.period} onChangeText={v => set('period', v)} placeholder="Week 1 Apr 2025" />
          <Field label="Notes" value={form.notes} onChangeText={v => set('notes', v)} placeholder="Optional details" />
          <Seg
            label="Payment Type"
            value={form.type}
            onChange={v => set('type', v)}
            options={[
              { value: 'weekly_labor', label: 'Weekly Labor' },
              { value: 'monthly_salary', label: 'Monthly' },
              { value: 'advance', label: 'Advance' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Seg
            label="Payment Method"
            value={form.method}
            onChange={v => set('method', v)}
            options={[
              { value: 'cash', label: '💵 Cash' },
              { value: 'bank_transfer', label: '🏦 Bank' },
              { value: 'upi', label: '📱 UPI' },
            ]}
          />
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelTxt}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.createBtn, saving && styles.btnOff]}
            onPress={handleCreate} disabled={saving}
          >
            <Text style={styles.createTxt}>{saving ? 'Creating...' : 'Create Payment'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function PaymentsScreen() {
  const { user } = useSelector(s => s.auth);
  const siteId = user?.primarySite;

  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(null);
  const [tab, setTab]             = useState('pending');
  const [showCreate, setShowCreate] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = tab === 'pending'
        ? await paymentService.getPending(siteId)
        : await paymentService.getAll({ siteId, limit: 50 });
      setPayments(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [siteId, tab]);

  useFocusEffect(useCallback(() => { loadPayments(); }, [loadPayments]));

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await paymentService.approve(id);
      loadPayments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (item) => {
    Alert.alert('Reject Payment', `Reject ₹${item.amount.toLocaleString()} for ${item.payeeName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessing(item._id);
          try { await paymentService.reject(item._id, 'Rejected by manager'); loadPayments(); }
          catch { Alert.alert('Error', 'Rejection failed'); }
          finally { setProcessing(null); }
        },
      },
    ]);
  };

  const handleMarkPaid = async (id) => {
    setProcessing(id);
    try {
      await paymentService.approve(id, 'paid');
      loadPayments();
    } catch (err) {
      Alert.alert('Error', 'Failed to mark as paid');
    } finally {
      setProcessing(null);
    }
  };

  const totalPending = payments.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments</Text>
          {tab === 'pending' && payments.length > 0 && (
            <Text style={styles.subtitle}>
              {payments.length} pending · ₹{totalPending.toLocaleString('en-IN')} total
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'pending', label: 'Pending' },
          { id: 'all',     label: 'All' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.info} size="large" /></View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={p => p._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>₹</Text>
              <Text style={styles.emptyTitle}>{tab === 'pending' ? 'No pending payments' : 'No payments yet'}</Text>
              <Text style={styles.emptySub}>Tap "+ New" to create a payment record</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PaymentCard
              item={item}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
              onMarkPaid={handleMarkPaid}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      <CreatePaymentModal
        visible={showCreate}
        siteId={siteId}
        onClose={() => setShowCreate(false)}
        onSaved={() => { setShowCreate(false); loadPayments(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgBase },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  title:    { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  newBtn:   { backgroundColor: Colors.info, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText:{ fontSize: Typography.sm, fontWeight: '700', color: Colors.white },

  tabs: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 3, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.info },
  tabText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.white, fontWeight: '700' },

  list:  { padding: Spacing.base, paddingTop: 0, paddingBottom: 120 },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:{ fontSize: 52, marginBottom: 12 },
  emptyTitle:{ fontSize: Typography.lg, fontWeight: '700', color: Colors.textSecondary },
  emptySub:  { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },

  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardBody: { flexDirection: 'row', padding: Spacing.base, gap: Spacing.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flex: 1 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  payeeName:  { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  payeeType:  { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  period:     { fontSize: Typography.xs, color: Colors.textMuted },
  methodLabel:{ fontSize: Typography.xs, color: Colors.info, fontWeight: '600', marginTop: 2 },
  cardRight:  { alignItems: 'flex-end', gap: 4 },
  amount:     { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  statusBadge:{ borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  dateStr:    { fontSize: Typography.xs, color: Colors.textMuted },
  noteRow:    { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.bgInput, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  noteText:   { fontSize: Typography.xs, color: Colors.textSecondary },

  actionRow:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider },
  rejectBtn:   { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: `${Colors.danger}10`, borderRightWidth: 1, borderRightColor: Colors.divider },
  approveBtn:  { flex: 2, paddingVertical: 13, alignItems: 'center', backgroundColor: Colors.success },
  rejectText:  { fontSize: Typography.base, fontWeight: '700', color: Colors.danger },
  approveText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
  paidBtn:     { paddingVertical: 13, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: `${Colors.info}15` },
  paidBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.info },
  btnOff:      { opacity: 0.45 },

  modal:       { flex: 1, backgroundColor: Colors.bgBase },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center' },
  closeTxt:    { fontSize: Typography.sm, color: Colors.textSecondary },
  modalFooter: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  fieldLabel:  { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input:       { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 12, color: Colors.textPrimary, fontSize: Typography.base },
  segBtn:      { backgroundColor: Colors.bgInput, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, marginRight: 6, borderWidth: 1, borderColor: Colors.border },
  segBtnActive:{ backgroundColor: Colors.info, borderColor: Colors.info },
  segText:     { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  segTextActive:{ color: Colors.white, fontWeight: '700' },
  cancelBtn:   { flex: 1, backgroundColor: Colors.bgInput, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelTxt:   { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  createBtn:   { flex: 1, backgroundColor: Colors.info, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  createTxt:   { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
});
