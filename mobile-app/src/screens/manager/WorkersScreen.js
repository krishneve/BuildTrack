import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { workerService } from '../../services/workerService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const TRADES = ['mason','carpenter','electrician','plumber','welder','helper','painter','supervisor','driver','other'];
const TRADE_EMOJI = { mason:'🧱', carpenter:'🪵', electrician:'⚡', plumber:'🔧', welder:'🔥', helper:'👷', painter:'🎨', supervisor:'📋', driver:'🚗', other:'👤' };
const WAGE_TYPES  = ['per_day', 'per_week', 'fixed_monthly'];

function TradeChip({ trade, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tradeChip, selected && styles.tradeChipActive]}
      onPress={onPress} activeOpacity={0.75}
    >
      <Text style={styles.tradeEmoji}>{TRADE_EMOJI[trade] || '👤'}</Text>
      <Text style={[styles.tradeLabel, selected && { color: Colors.textInverse }]}>
        {trade.charAt(0).toUpperCase() + trade.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

function WorkerCard({ worker, onEdit, onDeactivate, onPay }) {
  return (
    <View style={styles.workerCard}>
      <View style={styles.workerTop}>
        <View style={styles.workerLeft}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>{TRADE_EMOJI[worker.trade] || '👷'}</Text>
          </View>
          <View>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerTrade}>{worker.trade.charAt(0).toUpperCase() + worker.trade.slice(1)}</Text>
            {worker.phone && <Text style={styles.workerPhone}>{worker.phone}</Text>}
          </View>
        </View>
        <View style={styles.workerRight}>
          <Text style={styles.workerWage}>₹{worker.wageAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.workerWageType}>{worker.wageType.replace('_', ' ')}</Text>
        </View>
      </View>
      <View style={styles.workerActions}>
        <TouchableOpacity style={[styles.wAction, styles.wActionPay]} onPress={() => onPay(worker)} activeOpacity={0.8}>
          <Text style={styles.wActionPayText}>₹ Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.wAction} onPress={() => onEdit(worker)} activeOpacity={0.8}>
          <Text style={styles.wActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.wAction, styles.wActionDanger]} onPress={() => onDeactivate(worker)} activeOpacity={0.8}>
          <Text style={[styles.wActionText, { color: Colors.danger }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WorkerFormModal({ visible, worker, siteId, onClose, onSaved }) {
  const isEdit = !!worker;
  const [form, setForm] = useState({
    name: worker?.name || '',
    phone: worker?.phone || '',
    trade: worker?.trade || 'mason',
    employmentType: worker?.employmentType || 'daily',
    wageType: worker?.wageType || 'per_day',
    wageAmount: worker?.wageAmount?.toString() || '',
    notes: worker?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())    { Alert.alert('Required', 'Worker name is required'); return; }
    if (!form.wageAmount)     { Alert.alert('Required', 'Wage amount is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, wageAmount: Number(form.wageAmount), siteId };
      if (isEdit) await workerService.update(worker._id, payload);
      else        await workerService.create(payload);
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save worker');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEdit ? 'Edit Worker' : 'Add New Worker'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <FormField label="Full Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="e.g. Ramesh Kumar" />
          <FormField label="Phone" value={form.phone} onChangeText={v => set('phone', v)} placeholder="9876543210" keyboardType="phone-pad" />

          <Text style={styles.fieldLabel}>Trade / Skill *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
            {TRADES.map(t => (
              <TradeChip key={t} trade={t} selected={form.trade === t} onPress={() => set('trade', t)} />
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Wage Type</Text>
          <View style={styles.toggleRow}>
            {WAGE_TYPES.map(wt => (
              <TouchableOpacity
                key={wt}
                style={[styles.toggleBtn, form.wageType === wt && styles.toggleBtnActive]}
                onPress={() => set('wageType', wt)}
              >
                <Text style={[styles.toggleText, form.wageType === wt && styles.toggleTextActive]}>
                  {wt === 'per_day' ? 'Per Day' : wt === 'per_week' ? 'Per Week' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label={`Wage Amount (₹) *`}
            value={form.wageAmount}
            onChangeText={v => set('wageAmount', v)}
            placeholder="600"
            keyboardType="numeric"
          />
          <FormField label="Notes" value={form.notes} onChangeText={v => set('notes', v)} placeholder="Optional notes" multiline />
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave} disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : isEdit ? 'Update Worker' : 'Add Worker'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PayWorkerModal({ visible, worker, siteId, onClose, onSaved }) {
  const [days, setDays] = useState('6');
  const [method, setMethod] = useState('cash');
  const [paying, setPaying] = useState(false);

  const amount = worker?.wageType === 'per_day'
    ? (worker?.wageAmount || 0) * Number(days || 0)
    : worker?.wageAmount || 0;

  const handlePay = async () => {
    setPaying(true);
    try {
      await workerService.createPayment(worker._id, { days: Number(days), method, siteId, period: `${days} days` });
      Alert.alert('Payment Created', `Payment of ₹${amount.toLocaleString('en-IN')} created for ${worker.name}.`);
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.paySheet}>
          <Text style={styles.payTitle}>Pay {worker?.name}</Text>
          <Text style={styles.payTrade}>{worker?.trade} · ₹{worker?.wageAmount} {worker?.wageType?.replace('_', ' ')}</Text>

          {worker?.wageType === 'per_day' && (
            <>
              <Text style={styles.fieldLabel}>Days worked</Text>
              <TextInput
                style={styles.daysInput}
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </>
          )}

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>

          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.toggleRow}>
            {['cash', 'bank_transfer', 'upi'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, method === m && styles.toggleBtnActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.toggleText, method === m && styles.toggleTextActive]}>
                  {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.payBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors.success }, paying && styles.saveBtnDisabled]}
              onPress={handlePay} disabled={paying}
            >
              <Text style={styles.saveText}>{paying ? 'Processing...' : 'Create Payment'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FormField({ label, ...props }) {
  return (
    <View style={{ marginBottom: Spacing.base }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && { minHeight: 72, textAlignVertical: 'top' }]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function WorkersScreen() {
  const { user } = useSelector(s => s.auth);
  const siteId = user?.primarySite;
  const nav = useNavigation();

  const [workers, setWorkers]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [tradeFilter, setTrade] = useState('');
  const [editWorker, setEdit]   = useState(null);
  const [payWorker, setPay]     = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadWorkers = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        workerService.getAll(siteId, { trade: tradeFilter || undefined, search: search || undefined }),
        workerService.getStats(siteId),
      ]);
      setWorkers(wRes.data.data || []);
      setStats(sRes.data.data);
    } catch {}
    finally { setLoading(false); }
  }, [siteId, tradeFilter]);

  useFocusEffect(useCallback(() => { loadWorkers(); }, [loadWorkers]));

  const handleDeactivate = (w) => {
    Alert.alert('Remove Worker', `Remove ${w.name} from site?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await workerService.remove(w._id); loadWorkers(); }
        catch { Alert.alert('Error', 'Failed to remove worker'); }
      }},
    ]);
  };

  const filteredWorkers = search
    ? workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
    : workers;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workers</Text>
          {stats && <Text style={styles.subtitle}>{stats.total} active · Est. ₹{(stats.estimatedWeeklyBill/1000).toFixed(0)}K/week</Text>}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEdit(null); setShowForm(true); }} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search workers..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Trade filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: Spacing.base }}>
        {['', ...TRADES].map(t => (
          <TouchableOpacity
            key={t || 'all'}
            style={[styles.filterChip, tradeFilter === t && styles.filterChipActive]}
            onPress={() => setTrade(t)}
          >
            <Text style={[styles.filterChipText, tradeFilter === t && { color: Colors.textInverse }]}>
              {t ? `${TRADE_EMOJI[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}` : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.info} /></View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={w => w._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👷</Text>
              <Text style={styles.emptyTitle}>No workers found</Text>
              <Text style={styles.emptySub}>Tap "+ Add" to register your first worker</Text>
            </View>
          }
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onEdit={w => { setEdit(w); setShowForm(true); }}
              onDeactivate={handleDeactivate}
              onPay={w => setPay(w)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      <WorkerFormModal
        visible={showForm}
        worker={editWorker}
        siteId={siteId}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); loadWorkers(); }}
      />
      <PayWorkerModal
        visible={!!payWorker}
        worker={payWorker}
        siteId={siteId}
        onClose={() => setPay(null)}
        onSaved={() => { setPay(null); loadWorkers(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: Colors.bgBase },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingBottom: 0 },
  title:     { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:  { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  addBtn:    { backgroundColor: Colors.info, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:{ fontSize: Typography.sm, fontWeight: '700', color: Colors.white },
  searchRow: { padding: Spacing.base, paddingBottom: Spacing.sm },
  search: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: Typography.base,
  },
  filterScroll: { marginBottom: Spacing.sm },
  filterChip: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  filterChipText:   { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  list: { padding: Spacing.base, paddingTop: 0, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty:     { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:{ fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: Typography.md, fontWeight: '700', color: Colors.textSecondary },
  emptySub:  { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },

  // Worker card
  workerCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  workerTop:      { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.base },
  workerLeft:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  workerAvatar:   { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center' },
  workerAvatarText: { fontSize: 22 },
  workerName:     { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  workerTrade:    { fontSize: Typography.xs, color: Colors.info, fontWeight: '600', textTransform: 'capitalize' },
  workerPhone:    { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 1 },
  workerRight:    { alignItems: 'flex-end' },
  workerWage:     { fontSize: Typography.md, fontWeight: '800', color: Colors.success },
  workerWageType: { fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'capitalize' },
  workerActions:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider },
  wAction:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.divider },
  wActionPay:     { backgroundColor: `${Colors.success}12` },
  wActionDanger:  { backgroundColor: `${Colors.danger}08` },
  wActionPayText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.success },
  wActionText:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },

  // Trade chips
  tradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bgInput, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 6, borderWidth: 1, borderColor: Colors.border,
  },
  tradeChipActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  tradeEmoji:  { fontSize: 14 },
  tradeLabel:  { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },

  // Modal
  modal:       { flex: 1, backgroundColor: Colors.bgBase },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:  { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  modalClose:  { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { fontSize: Typography.sm, color: Colors.textSecondary },
  modalBody:   { flex: 1, padding: Spacing.base },
  modalFooter: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },

  fieldLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: Typography.base,
  },
  toggleRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  toggleBtn:    { flex: 1, backgroundColor: Colors.bgInput, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  toggleBtnActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  toggleText:   { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.white, fontWeight: '700' },

  cancelBtn:   { flex: 1, backgroundColor: Colors.bgInput, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelText:  { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn:     { flex: 1, backgroundColor: Colors.info, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText:    { fontSize: Typography.base, fontWeight: '700', color: Colors.white },

  // Pay modal
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  paySheet:  { backgroundColor: Colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.xl, paddingBottom: 40 },
  payTitle:  { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  payTrade:  { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.base, textTransform: 'capitalize' },
  daysInput: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 12, color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.base },
  amountBox: { backgroundColor: `${Colors.success}18`, borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center', marginBottom: Spacing.base },
  amountLabel: { fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  amountValue: { fontSize: Typography.xxxl, fontWeight: '900', color: Colors.success },
  payBtns:   { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
