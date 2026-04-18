import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BTButton from '../../components/common/BTButton';
import BTCard from '../../components/common/BTCard';
import BTInput from '../../components/common/BTInput';
import PageHeader from '../../components/common/PageHeader';
import { inventoryService } from '../../services/inventoryService';
import { enqueue } from '../../services/offlineQueue';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function LogMaterialScreen() {
  const { user } = useSelector((s) => s.auth);
  const { isConnected } = useSelector((s) => s.network);
  const nav = useNavigation();
  const siteId = user?.primarySite;

  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [txType, setTxType] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (siteId) {
      inventoryService.getMaterials(siteId)
        .then(({ data }) => setMaterials(data.data || []))
        .catch(() => {});
    }
  }, [siteId]);

  const handleSubmit = async () => {
    if (!selected) { Alert.alert('Required', 'Please select a material'); return; }
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert('Required', 'Enter a valid quantity'); return;
    }

    setSubmitting(true);
    const payload = { siteId, materialId: selected._id, type: txType, quantity: Number(quantity), notes };
    const action = { type: 'LOG_MATERIAL', method: 'POST', url: '/inventory/log', data: payload };

    try {
      if (!isConnected) {
        await enqueue(action);
        Alert.alert('Saved Offline', 'Material log saved. Will sync when online.', [{ text: 'OK', onPress: () => nav.goBack() }]);
      } else {
        await inventoryService.logMaterial(siteId, selected._id, txType, Number(quantity), notes);
        Alert.alert('Logged!', `${txType.toUpperCase()} of ${quantity} ${selected.unit} ${selected.name} recorded.`,
          [{ text: 'OK', onPress: () => nav.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to log material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <PageHeader title="Log Material" subtitle="Record material IN or OUT" showBack />

      {/* Type toggle — large touch targets */}
      <BTCard style={styles.typeCard}>
        <Text style={styles.typeLabel}>Transaction Type</Text>
        <View style={styles.typeRow}>
          {['in', 'out'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, txType === t && styles.typeBtnActive(t)]}
              onPress={() => setTxType(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeEmoji]}>{t === 'in' ? '⬇' : '⬆'}</Text>
              <Text style={[styles.typeBtnText, txType === t && { color: Colors.textInverse, fontWeight: '800' }]}>
                Material {t.toUpperCase()}
              </Text>
              <Text style={[styles.typeHint, txType === t && { color: `${Colors.textInverse}AA` }]}>
                {t === 'in' ? 'Received at site' : 'Consumed / dispatched'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BTCard>

      {/* Material selector */}
      <BTCard style={styles.section}>
        <Text style={styles.sectionTitle}>Select Material</Text>
        {materials.length === 0 ? (
          <Text style={styles.emptyText}>No materials found for this site</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.materialScroll}>
            {materials.map((m) => (
              <TouchableOpacity
                key={m._id}
                style={[styles.matChip, selected?._id === m._id && styles.matChipActive]}
                onPress={() => setSelected(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.matEmoji]}>{m.emoji || '▦'}</Text>
                <Text style={[styles.matName, selected?._id === m._id && { color: Colors.textInverse }]}>{m.name}</Text>
                <Text style={[styles.matStock, selected?._id === m._id && { color: `${Colors.textInverse}AA` }]}>
                  Stock: {m.currentStock} {m.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </BTCard>

      {/* Quantity */}
      <BTInput
        label={`Quantity ${selected ? `(${selected.unit})` : ''}`}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Enter quantity"
        style={{ marginBottom: Spacing.base }}
      />

      <BTInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Received from Shree Cement supplier"
        multiline
        inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
        style={{ marginBottom: Spacing.lg }}
      />

      <BTButton
        label={submitting ? 'Saving...' : `Log Material ${txType.toUpperCase()}`}
        onPress={handleSubmit}
        loading={submitting}
        size="lg"
        variant={txType === 'in' ? 'success' : 'danger'}
        icon={txType === 'in' ? '⬇' : '⬆'}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  typeCard: { marginBottom: Spacing.base },
  typeLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: {
    flex: 1, backgroundColor: Colors.bgInput, borderRadius: Radius.lg,
    padding: Spacing.base, alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  typeBtnActive: (t) => ({
    backgroundColor: t === 'in' ? Colors.success : Colors.danger,
    borderColor: t === 'in' ? Colors.success : Colors.danger,
  }),
  typeEmoji: { fontSize: 24 },
  typeBtnText: { fontSize: Typography.base, fontWeight: '600', color: Colors.textSecondary },
  typeHint: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
  section: { marginBottom: Spacing.base },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, fontStyle: 'italic' },
  materialScroll: { },
  matChip: {
    backgroundColor: Colors.bgInput, borderRadius: Radius.md, padding: Spacing.sm,
    marginRight: Spacing.sm, alignItems: 'center', minWidth: 90, gap: 4,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  matChipActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  matEmoji: { fontSize: 20 },
  matName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  matStock: { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center' },
});
