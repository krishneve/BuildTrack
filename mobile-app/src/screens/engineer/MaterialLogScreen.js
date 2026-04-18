import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { engineerService } from '../../services/engineerService';
import { enqueue } from '../../services/offlineQueue';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const CAT_EMOJI = {
  cement:'🏗', steel:'⚙', bricks:'🧱', sand:'🟨', aggregate:'⬤',
  wood:'🪵', paint:'🎨', plumbing:'🔧', electrical:'⚡', safety:'⛑', other:'▦',
};

function TypeToggle({ value, onChange }) {
  return (
    <View style={styles.typeToggle}>
      {['in', 'out'].map(t => (
        <TouchableOpacity
          key={t}
          style={[styles.typeBtn, value === t && (t === 'in' ? styles.typeBtnIn : styles.typeBtnOut)]}
          onPress={() => onChange(t)}
          activeOpacity={0.8}
        >
          <Text style={styles.typeBtnEmoji}>{t === 'in' ? '⬇' : '⬆'}</Text>
          <Text style={[styles.typeBtnLbl, value === t && { color: Colors.white, fontWeight: '700' }]}>
            Material {t.toUpperCase()}
          </Text>
          <Text style={[styles.typeBtnHint, value === t && { color: `${Colors.white}99` }]}>
            {t === 'in' ? 'Received at site' : 'Used / consumed'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MaterialPicker({ materials, selected, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.includes(search.toLowerCase()))
    : materials;

  return (
    <View style={styles.pickerWrap}>
      <TextInput
        style={styles.pickerSearch}
        placeholder="Search materials..."
        placeholderTextColor={Colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={m => m._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: 2 }}
        renderItem={({ item }) => {
          const isSelected = selected?._id === item._id;
          const isLow      = item.currentStock <= item.minThreshold;
          return (
            <TouchableOpacity
              style={[styles.matChip, isSelected && styles.matChipSelected, isLow && styles.matChipLow]}
              onPress={() => onSelect(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.matChipEmoji}>{CAT_EMOJI[item.category] || '▦'}</Text>
              <Text style={[styles.matChipName, isSelected && { color: Colors.textInverse }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.matChipStock}>
                <Text style={[styles.matChipStockTxt, isLow && { color: Colors.danger }, isSelected && { color: `${Colors.textInverse}BB` }]}>
                  {isLow ? '⚠ ' : ''}{item.currentStock} {item.unit}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ color: Colors.textMuted, padding: 16 }}>No materials found</Text>}
      />
    </View>
  );
}

export default function MaterialLogScreen() {
  const { user }        = useSelector(s => s.auth);
  const { isConnected } = useSelector(s => s.network);
  const route           = useRoute();
  const nav             = useNavigation();
  const siteId          = user?.primarySite;

  const defaultType = route.params?.defaultType || 'in';

  const [type,      setType]     = useState(defaultType);
  const [materials, setMaterials] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [qty,       setQty]       = useState('');
  const [extra,     setExtra]     = useState(''); // supplier (for IN) or purpose (for OUT)
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    engineerService.getStock(siteId)
      .then(({ data }) => setMaterials(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleSubmit = async () => {
    if (!selected) { Alert.alert('Select Material', 'Please choose a material first'); return; }
    const qtyNum = Number(qty);
    if (!qty || isNaN(qtyNum) || qtyNum <= 0) { Alert.alert('Invalid Qty', 'Enter a valid quantity'); return; }
    if (type === 'out' && qtyNum > selected.currentStock) {
      Alert.alert('Insufficient Stock', `Only ${selected.currentStock} ${selected.unit} available`);
      return;
    }

    setSubmitting(true);
    const payload = {
      siteId,
      materialId: selected._id,
      quantity: qtyNum,
      notes,
      ...(type === 'in' ? { supplier: extra } : { purpose: extra }),
    };

    try {
      if (!isConnected) {
        const offlineId = `mat-${Date.now()}`;
        await enqueue({
          type: type === 'in' ? 'MATERIAL_IN' : 'MATERIAL_OUT',
          method: 'POST',
          url: `/engineer/material-${type}`,
          data: { ...payload, offlineId },
        });
        Alert.alert('Saved ⚡', `${selected.name} ${type.toUpperCase()} queued for sync.`, [{ text: 'OK', onPress: () => nav.goBack() }]);
      } else {
        const fn = type === 'in' ? engineerService.materialIn : engineerService.materialOut;
        const { data } = await fn(payload);
        const res = data.data;
        Alert.alert(
          `Logged ✓`,
          `${qtyNum} ${selected.unit} ${type === 'in' ? 'received' : 'used'}.\nNew stock: ${res.newStock} ${selected.unit}${res.isLowStock ? '\n⚠ LOW STOCK' : ''}`,
          [{ text: 'OK', onPress: () => nav.goBack() }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to log material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.8}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Material</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>

        {/* Type toggle */}
        <TypeToggle value={type} onChange={setType} />

        {/* Material picker */}
        <Text style={styles.label}>Select Material</Text>
        {loading ? (
          <ActivityIndicator color={Colors.engineer} style={{ marginVertical: 16 }} />
        ) : (
          <MaterialPicker materials={materials} selected={selected} onSelect={setSelected} />
        )}

        {/* Selected material detail */}
        {selected && (
          <View style={[styles.selectedCard, selected.currentStock <= selected.minThreshold && styles.selectedCardLow]}>
            <Text style={styles.selectedEmoji}>{CAT_EMOJI[selected.category] || '▦'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.selectedStock}>
                Stock: {selected.currentStock} {selected.unit}
                {selected.currentStock <= selected.minThreshold ? ' ⚠ LOW' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} style={styles.clearBtn}>
              <Text style={styles.clearTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quantity — huge input */}
        <Text style={styles.label}>Quantity {selected ? `(${selected.unit})` : ''}</Text>
        <TextInput
          style={styles.qtyInput}
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          selectTextOnFocus
        />

        {/* Supplier / Purpose */}
        <Text style={styles.label}>{type === 'in' ? 'Supplier (optional)' : 'Usage / Purpose (optional)'}</Text>
        <TextInput
          style={styles.fieldInput}
          value={extra}
          onChangeText={setExtra}
          placeholder={type === 'in' ? 'e.g. Ambuja Cements Nashik' : 'e.g. 3rd floor slab work'}
          placeholderTextColor={Colors.textMuted}
        />

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.fieldInput, { minHeight: 72, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional details..."
          placeholderTextColor={Colors.textMuted}
          multiline
        />

        {/* Offline note */}
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineTxt}>⚡ Offline — will sync automatically when online</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: type === 'in' ? Colors.success : Colors.danger }, (!selected || !qty || submitting) && styles.submitOff]}
          onPress={handleSubmit}
          disabled={!selected || !qty || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="large" />
          ) : (
            <>
              <Text style={styles.submitEmoji}>{type === 'in' ? '⬇' : '⬆'}</Text>
              <Text style={styles.submitTxt}>LOG MATERIAL {type.toUpperCase()}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bgBase },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backTxt: { fontSize: 18, color: Colors.textPrimary },
  title:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.base, paddingBottom: 60 },
  label:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: Spacing.base },

  typeToggle: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  typeBtn:    { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.base, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  typeBtnIn:  { backgroundColor: Colors.success, borderColor: Colors.success },
  typeBtnOut: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  typeBtnEmoji:{ fontSize: 22 },
  typeBtnLbl: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  typeBtnHint:{ fontSize: Typography.xs, color: Colors.textMuted },

  pickerWrap:   { marginBottom: Spacing.sm },
  pickerSearch: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 10, color: Colors.textPrimary, fontSize: Typography.base, marginBottom: Spacing.sm },
  matChip:      { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, alignItems: 'center', minWidth: 90, gap: 4 },
  matChipSelected:{ backgroundColor: Colors.engineer, borderColor: Colors.engineer },
  matChipLow:   { borderColor: `${Colors.danger}50` },
  matChipEmoji: { fontSize: 22 },
  matChipName:  { fontSize: Typography.xs, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  matChipStock: { },
  matChipStockTxt: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },

  selectedCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: `${Colors.engineer}12`, borderRadius: Radius.lg, borderWidth: 1, borderColor: `${Colors.engineer}35`, padding: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.sm },
  selectedCardLow: { backgroundColor: `${Colors.danger}10`, borderColor: `${Colors.danger}40` },
  selectedEmoji:   { fontSize: 28 },
  selectedName:    { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  selectedStock:   { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  clearBtn:        { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center' },
  clearTxt:        { fontSize: Typography.xs, color: Colors.textSecondary },

  qtyInput:    { backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingVertical: 20, textAlign: 'center', color: Colors.textPrimary, fontSize: 56, fontWeight: '900', marginBottom: Spacing.sm },
  fieldInput:  { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 12, color: Colors.textPrimary, fontSize: Typography.base },

  offlineBanner: { backgroundColor: `${Colors.warning}15`, borderRadius: Radius.md, padding: Spacing.sm, marginVertical: Spacing.sm, borderWidth: 1, borderColor: `${Colors.warning}30` },
  offlineTxt:    { fontSize: Typography.xs, color: Colors.warning, fontWeight: '600', textAlign: 'center' },

  submitBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: Radius.xl, paddingVertical: 20, gap: 12, marginTop: Spacing.base },
  submitOff:  { opacity: 0.4 },
  submitEmoji:{ fontSize: 24, color: Colors.white },
  submitTxt:  { fontSize: Typography.lg, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
});
