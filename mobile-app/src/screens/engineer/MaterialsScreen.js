import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { engineerService } from '../../services/engineerService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const CAT_EMOJI = {
  cement:'🏗', steel:'⚙', bricks:'🧱', sand:'🟨', aggregate:'⬤',
  wood:'🪵', paint:'🎨', plumbing:'🔧', electrical:'⚡', safety:'⛑', other:'▦',
};

const CATEGORIES = ['all', 'cement', 'steel', 'bricks', 'sand', 'aggregate', 'wood', 'paint', 'plumbing', 'electrical', 'safety', 'other'];

function StockCard({ item, onLog }) {
  const isLow  = item.isLowStock;
  const pct    = item.fillPercent;

  return (
    <View style={[styles.card, isLow && styles.cardLow]}>
      <View style={styles.cardTop}>
        <View style={[styles.matIcon, { backgroundColor: isLow ? `${Colors.danger}18` : `${Colors.engineer}12` }]}>
          <Text style={styles.matEmoji}>{CAT_EMOJI[item.category] || '▦'}</Text>
        </View>
        <View style={styles.matMeta}>
          <Text style={styles.matName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.matCat}>{item.category?.toUpperCase()} · ₹{item.unitCost}/{item.unit}</Text>
        </View>
        <View style={styles.stockWrap}>
          <Text style={[styles.stockQty, isLow && { color: Colors.danger }]}>
            {item.currentStock}
          </Text>
          <Text style={styles.stockUnit}>{item.unit}</Text>
          {isLow && <Text style={styles.lowTag}>LOW ⚠</Text>}
        </View>
      </View>

      {/* Fill bar */}
      {pct !== null && (
        <View style={styles.barWrap}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${pct}%`,
              backgroundColor: isLow ? Colors.danger : pct > 60 ? Colors.engineer : Colors.warning,
            }]} />
          </View>
          <Text style={styles.barPct}>{pct}%</Text>
        </View>
      )}

      {/* Quick log buttons */}
      <View style={styles.logBtns}>
        <TouchableOpacity
          style={styles.logBtnIn}
          onPress={() => onLog(item, 'in')}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnInTxt}>⬇ IN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logBtnOut}
          onPress={() => onLog(item, 'out')}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnOutTxt}>⬆ OUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MaterialsScreen() {
  const { user }   = useSelector(s => s.auth);
  const nav        = useNavigation();
  const siteId     = user?.primarySite;

  const [stock,    setStock]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter] = useState('all');

  const loadStock = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await engineerService.getStock(siteId);
      setStock(data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [siteId]);

  useFocusEffect(useCallback(() => { loadStock(); }, [loadStock]));

  const filtered = stock.filter(m => {
    const matchCat    = catFilter === 'all' || m.category === catFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowCount = stock.filter(m => m.isLowStock).length;

  const handleLog = (material, type) => {
    nav.navigate('MaterialLog', { defaultType: type, preselected: material._id });
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Materials</Text>
          <Text style={styles.subtitle}>{stock.length} items · {lowCount > 0 ? `${lowCount} low stock` : 'all good'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logNewBtn}
          onPress={() => nav.navigate('MaterialLog', { defaultType: 'in' })}
          activeOpacity={0.8}
        >
          <Text style={styles.logNewTxt}>+ Log</Text>
        </TouchableOpacity>
      </View>

      {/* Low stock alert strip */}
      {lowCount > 0 && (
        <View style={styles.alertStrip}>
          <Text style={styles.alertTxt}>
            ⚠  {lowCount} item{lowCount !== 1 ? 's' : ''} below minimum threshold — inform your manager
          </Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search materials..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catChip, catFilter === cat && styles.catChipActive]}
            onPress={() => setCatFilter(cat)}
          >
            <Text style={[styles.catChipTxt, catFilter === cat && { color: Colors.textInverse, fontWeight: '700' }]}>
              {cat !== 'all' ? `${CAT_EMOJI[cat] || ''} ` : ''}{cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.catScroll}
      />

      {/* Stock list */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.engineer} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={m => m._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>▦</Text>
              <Text style={styles.emptyTitle}>{search || catFilter !== 'all' ? 'No matches' : 'No materials yet'}</Text>
              <Text style={styles.emptySub}>{search ? 'Try a different search' : 'Contact admin to add materials'}</Text>
            </View>
          }
          renderItem={({ item }) => <StockCard item={item} onLog={handleLog} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bgBase },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingBottom: Spacing.sm },
  title:    { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  logNewBtn:{ backgroundColor: Colors.engineer, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  logNewTxt:{ fontSize: Typography.sm, fontWeight: '700', color: Colors.white },

  alertStrip:{ backgroundColor: `${Colors.danger}12`, paddingHorizontal: Spacing.base, paddingVertical: 8, marginHorizontal: Spacing.base, borderRadius: Radius.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: `${Colors.danger}30` },
  alertTxt:  { fontSize: Typography.xs, fontWeight: '700', color: Colors.danger },

  searchWrap:{ paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  search:    { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 10, color: Colors.textPrimary, fontSize: Typography.base },

  catScroll: { marginBottom: Spacing.sm },
  catList:   { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  catChip:   { backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.engineer, borderColor: Colors.engineer },
  catChipTxt:{ fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },

  list:   { paddingHorizontal: Spacing.base, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyWrap:  { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.textSecondary },
  emptySub:   { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },

  card:     { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardLow:  { borderColor: `${Colors.danger}50` },
  cardTop:  { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
  matIcon:  { width: 50, height: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  matEmoji: { fontSize: 26 },
  matMeta:  { flex: 1 },
  matName:  { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  matCat:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  stockWrap:{ alignItems: 'flex-end', gap: 1 },
  stockQty: { fontSize: Typography.xl, fontWeight: '800', color: Colors.engineer },
  stockUnit:{ fontSize: Typography.xs, color: Colors.textMuted },
  lowTag:   { fontSize: Typography.xs, fontWeight: '800', color: Colors.danger },

  barWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.bgInput, borderRadius: 3 },
  barFill:  { height: 6, borderRadius: 3 },
  barPct:   { fontSize: Typography.xs, color: Colors.textMuted, width: 32, textAlign: 'right' },

  logBtns:    { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider },
  logBtnIn:   { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: `${Colors.success}12`, borderRightWidth: 1, borderRightColor: Colors.divider },
  logBtnOut:  { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: `${Colors.danger}08` },
  logBtnInTxt:  { fontSize: Typography.base, fontWeight: '700', color: Colors.success },
  logBtnOutTxt: { fontSize: Typography.base, fontWeight: '700', color: Colors.danger },
});
