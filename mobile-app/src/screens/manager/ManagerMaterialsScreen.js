import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { inventoryService } from '../../services/inventoryService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const CAT_EMOJI = {
  cement:'🏗', steel:'⚙', bricks:'🧱', sand:'🟨', aggregate:'⬤',
  wood:'🪵', paint:'🎨', plumbing:'🔧', electrical:'⚡', safety:'⛑', other:'▦',
};

function StockCard({ item, onLog }) {
  const isLow = item.currentStock <= item.minThreshold;
  const pct = item.maxCapacity
    ? Math.min((item.currentStock / item.maxCapacity) * 100, 100) : null;

  return (
    <View style={[styles.stockCard, isLow && styles.stockCardLow]}>
      <View style={styles.stockTop}>
        <View style={[styles.matIcon, { backgroundColor: isLow ? `${Colors.danger}18` : `${Colors.info}18` }]}>
          <Text style={styles.matEmoji}>{CAT_EMOJI[item.category] || '▦'}</Text>
        </View>
        <View style={styles.matInfo}>
          <Text style={styles.matName}>{item.name}</Text>
          <Text style={styles.matCat}>{item.category?.toUpperCase()} · ₹{item.unitCost}/{item.unit}</Text>
        </View>
        <View style={styles.stockRight}>
          <Text style={[styles.stockQty, isLow && { color: Colors.danger }]}>
            {item.currentStock}
          </Text>
          <Text style={styles.stockUnit}>{item.unit}</Text>
          {isLow && <Text style={styles.lowTag}>LOW ⚠</Text>}
        </View>
      </View>

      {pct !== null && (
        <View style={styles.barWrap}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${pct}%`,
              backgroundColor: isLow ? Colors.danger : pct > 60 ? Colors.success : Colors.warning,
            }]} />
          </View>
          <Text style={styles.barPct}>{pct.toFixed(0)}%</Text>
        </View>
      )}

      <View style={styles.logRow}>
        <TouchableOpacity
          style={[styles.logBtn, styles.logBtnIn]}
          onPress={() => onLog(item, 'in')}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnInText}>⬇ IN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logBtn, styles.logBtnOut]}
          onPress={() => onLog(item, 'out')}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnOutText}>⬆ OUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LogModal({ visible, material, type: initType, siteId, onClose, onSaved }) {
  const [type, setType] = useState(initType || 'in');
  const [qty, setQty]   = useState('');
  const [notes, setNotes] = useState('');
  const [supplier, setSupplier] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) { setType(initType || 'in'); setQty(''); setNotes(''); setSupplier(''); }
  }, [visible, initType]);

  const handleLog = async () => {
    if (!qty || isNaN(qty) || Number(qty) <= 0) {
      Alert.alert('Required', 'Enter a valid quantity');
      return;
    }
    if (type === 'out' && Number(qty) > material.currentStock) {
      Alert.alert('Insufficient Stock', `Only ${material.currentStock} ${material.unit} available`);
      return;
    }
    setSaving(true);
    try {
      await inventoryService.logMaterial({
        siteId, materialId: material._id,
        type, quantity: Number(qty), notes, supplier,
      });
      Alert.alert('Logged!', `${type.toUpperCase()} of ${qty} ${material.unit} recorded.`);
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Log Material</Text>
        <Text style={styles.modalSub}>{material?.name} · Stock: {material?.currentStock} {material?.unit}</Text>

        {/* Type toggle */}
        <View style={styles.typeToggle}>
          {['in', 'out'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && (t === 'in' ? styles.typeBtnIn : styles.typeBtnOut)]}
              onPress={() => setType(t)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeBtnEmoji}>{t === 'in' ? '⬇' : '⬆'}</Text>
              <Text style={[styles.typeBtnLabel, type === t && { color: Colors.white, fontWeight: '700' }]}>
                Material {t.toUpperCase()}
              </Text>
              <Text style={[styles.typeBtnHint, type === t && { color: `${Colors.white}AA` }]}>
                {t === 'in' ? 'Received' : 'Consumed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity — large input */}
        <View style={styles.qtyWrap}>
          <Text style={styles.fieldLabel}>Quantity ({material?.unit})</Text>
          <TextInput
            style={styles.qtyInput}
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            selectTextOnFocus
          />
        </View>

        {type === 'in' && (
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Supplier</Text>
            <TextInput
              style={styles.fieldInput}
              value={supplier}
              onChangeText={setSupplier}
              placeholder="Supplier name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 64, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelTxt}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.logSubmitBtn, { backgroundColor: type === 'in' ? Colors.success : Colors.danger }, saving && { opacity: 0.5 }]}
            onPress={handleLog} disabled={saving}
          >
            <Text style={styles.logSubmitTxt}>{saving ? 'Logging...' : `Log ${type.toUpperCase()}`}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ManagerMaterialsScreen() {
  const { user } = useSelector(s => s.auth);
  const siteId = user?.primarySite;

  const [stock, setStock]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('stock');
  const [logModal, setLogModal] = useState({ visible: false, material: null, type: 'in' });

  const loadData = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const [sRes, sumRes, lRes] = await Promise.all([
        inventoryService.getStock(siteId),
        inventoryService.getSummary(siteId),
        inventoryService.getLogs({ siteId, limit: 40 }),
      ]);
      setStock(sRes.data.data || []);
      setSummary(sumRes.data.data);
      setLogs(lRes.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [siteId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const lowStock = stock.filter(m => m.currentStock <= m.minThreshold);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Materials</Text>
          {summary && (
            <Text style={styles.subtitle}>
              {summary.totalItems} items · {summary.lowStockCount} low
            </Text>
          )}
        </View>
      </View>

      {/* Low stock alert strip */}
      {lowStock.length > 0 && (
        <View style={styles.alertStrip}>
          <Text style={styles.alertText}>
            ⚠  {lowStock.length} item{lowStock.length !== 1 ? 's' : ''} below minimum threshold
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {[{ id: 'stock', label: 'Stock' }, { id: 'logs', label: 'Logs' }].map(t => (
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
      ) : tab === 'stock' ? (
        <FlatList
          data={stock}
          keyExtractor={m => m._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>▦</Text>
              <Text style={styles.emptyTitle}>No materials</Text>
              <Text style={styles.emptySub}>Contact admin to add materials to catalogue</Text>
            </View>
          }
          renderItem={({ item }) => (
            <StockCard
              item={item}
              onLog={(m, type) => setLogModal({ visible: true, material: m, type })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={l => l._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptySub}>No transactions yet</Text></View>}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={[styles.logTypePill, { backgroundColor: item.type === 'in' ? `${Colors.success}20` : `${Colors.danger}20` }]}>
                <Text style={[styles.logTypeTxt, { color: item.type === 'in' ? Colors.success : Colors.danger }]}>
                  {item.type === 'in' ? '⬇' : '⬆'} {item.type.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.logMatName}>{item.material?.name}</Text>
                <Text style={styles.logMeta}>
                  {item.quantity} {item.material?.unit} · Balance: {item.balanceAfter} {item.material?.unit}
                </Text>
                <Text style={styles.logWho}>
                  By {item.loggedBy?.name} · {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}

      <LogModal
        visible={logModal.visible}
        material={logModal.material}
        type={logModal.type}
        siteId={siteId}
        onClose={() => setLogModal({ visible: false, material: null, type: 'in' })}
        onSaved={() => { setLogModal({ visible: false, material: null, type: 'in' }); loadData(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgBase },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  title:  { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  alertStrip: { backgroundColor: `${Colors.danger}18`, paddingHorizontal: Spacing.base, paddingVertical: 8, marginHorizontal: Spacing.base, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: `${Colors.danger}30` },
  alertText:  { fontSize: Typography.xs, fontWeight: '700', color: Colors.danger },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 3, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  tab:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.info },
  tabText:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list:  { padding: Spacing.base, paddingTop: 0, paddingBottom: 120 },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:{ fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: Typography.md, fontWeight: '700', color: Colors.textSecondary },
  emptySub:  { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  stockCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  stockCardLow: { borderColor: `${Colors.danger}50` },
  stockTop: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
  matIcon:  { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  matEmoji: { fontSize: 24 },
  matInfo:  { flex: 1 },
  matName:  { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  matCat:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  stockRight:{ alignItems: 'flex-end' },
  stockQty:  { fontSize: Typography.xl, fontWeight: '800', color: Colors.success },
  stockUnit: { fontSize: Typography.xs, color: Colors.textMuted },
  lowTag:    { fontSize: Typography.xs, fontWeight: '800', color: Colors.danger, marginTop: 2 },
  barWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  barTrack:  { flex: 1, height: 6, backgroundColor: Colors.bgInput, borderRadius: 3 },
  barFill:   { height: 6, borderRadius: 3 },
  barPct:    { fontSize: Typography.xs, color: Colors.textMuted, width: 32, textAlign: 'right' },
  logRow:    { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider },
  logBtn:    { flex: 1, paddingVertical: 11, alignItems: 'center' },
  logBtnIn:  { backgroundColor: `${Colors.success}12`, borderRightWidth: 1, borderRightColor: Colors.divider },
  logBtnOut: { backgroundColor: `${Colors.danger}10` },
  logBtnInText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.success },
  logBtnOutText:{ fontSize: Typography.sm, fontWeight: '700', color: Colors.danger },
  logCard:   { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  logTypePill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  logTypeTxt:  { fontSize: Typography.xs, fontWeight: '700' },
  logMatName:  { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  logMeta:     { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  logWho:      { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  modal:        { flex: 1, backgroundColor: Colors.bgBase, padding: Spacing.lg },
  modalHandle:  { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle:   { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  modalSub:     { fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
  typeToggle:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  typeBtn:      { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.base, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  typeBtnIn:    { backgroundColor: Colors.success, borderColor: Colors.success },
  typeBtnOut:   { backgroundColor: Colors.danger, borderColor: Colors.danger },
  typeBtnEmoji: { fontSize: 22 },
  typeBtnLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  typeBtnHint:  { fontSize: Typography.xs, color: Colors.textMuted },
  qtyWrap:      { marginBottom: Spacing.base },
  fieldLabel:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  qtyInput:     { backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: 16, textAlign: 'center', color: Colors.textPrimary, fontSize: 48, fontWeight: '800' },
  fieldWrap:    { marginBottom: Spacing.base },
  fieldInput:   { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 12, color: Colors.textPrimary, fontSize: Typography.base },
  modalBtns:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.base },
  cancelBtn:    { flex: 1, backgroundColor: Colors.bgInput, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelTxt:    { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  logSubmitBtn: { flex: 1, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  logSubmitTxt: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
});
