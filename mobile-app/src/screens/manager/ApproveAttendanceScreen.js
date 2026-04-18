import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { attendanceService } from '../../services/attendanceService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

function AttendanceCard({ item, onApprove, onReject, processing }) {
  const isIn = item.type === 'in';
  const time = new Date(item.markedAt || item.date);
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const isProcessing = processing === item._id;

  return (
    <View style={styles.card}>
      {/* Worker info row */}
      <View style={styles.cardTop}>
        <View style={[styles.typeIcon, { backgroundColor: isIn ? `${Colors.success}20` : `${Colors.danger}20` }]}>
          <Text style={[styles.typeEmoji, { color: isIn ? Colors.success : Colors.danger }]}>
            {isIn ? '→' : '←'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.workerName}>{item.worker?.name || 'Unknown'}</Text>
          <Text style={styles.workerRole}>
            {item.worker?.designation || item.worker?.role || 'Worker'}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.typeBadge, { backgroundColor: isIn ? `${Colors.success}20` : `${Colors.danger}20` }]}>
            <Text style={[styles.typeBadgeText, { color: isIn ? Colors.success : Colors.danger }]}>
              {isIn ? 'CHECK IN' : 'CHECK OUT'}
            </Text>
          </View>
          <Text style={styles.timeText}>{timeStr}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </View>

      {/* Notes */}
      {item.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>📝 {item.notes}</Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
          onPress={() => onReject(item._id)}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing
            ? <ActivityIndicator size="small" color={Colors.danger} />
            : <Text style={styles.rejectText}>✕  Reject</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.approveBtn, isProcessing && styles.btnDisabled]}
          onPress={() => onApprove(item._id)}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.approveText}>✓  Approve</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ApproveAttendanceScreen() {
  const { user } = useSelector(s => s.auth);
  const siteId = user?.primarySite;

  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(null);
  const [remarks, setRemarks]     = useState('');
  const [tab, setTab]             = useState('pending'); // pending | all

  const loadRecords = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = tab === 'pending'
        ? await attendanceService.getPendingApprovals(siteId)
        : await attendanceService.getTodayAttendance(siteId);
      setRecords(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [siteId, tab]);

  useFocusEffect(useCallback(() => { loadRecords(); }, [loadRecords]));

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await attendanceService.updateStatus(id, 'approved', '');
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (id) => {
    Alert.alert('Reject Attendance', 'Add a reason (optional):', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessing(id);
          try {
            await attendanceService.updateStatus(id, 'rejected', '');
            setRecords(prev => prev.filter(r => r._id !== id));
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Rejection failed');
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const approveAll = () => {
    if (!records.length) return;
    Alert.alert(
      'Approve All',
      `Approve all ${records.length} pending attendance records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            for (const r of records) {
              try { await attendanceService.updateStatus(r._id, 'approved', ''); } catch {}
            }
            loadRecords();
          },
        },
      ]
    );
  };

  const pending = records.filter(r => r.status === 'pending' || tab === 'pending');

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>
            {tab === 'pending' ? `${records.length} awaiting approval` : "Today's records"}
          </Text>
        </View>
        {tab === 'pending' && records.length > 1 && (
          <TouchableOpacity style={styles.approveAllBtn} onPress={approveAll} activeOpacity={0.8}>
            <Text style={styles.approveAllText}>✓ All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'pending', label: 'Pending', count: tab === 'pending' ? records.length : null },
          { id: 'all',     label: "Today" },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
              {t.count != null && t.count > 0 ? ` (${t.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.info} size="large" /></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => r._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{tab === 'pending' ? '✓' : '📋'}</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'pending' ? 'All caught up!' : 'No records today'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'pending' ? 'No pending attendance to approve' : 'Workers have not marked attendance yet'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            tab === 'pending' ? (
              <AttendanceCard
                item={item}
                processing={processing}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ) : (
              <View style={styles.historyCard}>
                <View style={styles.cardTop}>
                  <View style={[styles.typeIcon, { backgroundColor: item.type === 'in' ? `${Colors.success}20` : `${Colors.danger}20` }]}>
                    <Text style={{ color: item.type === 'in' ? Colors.success : Colors.danger, fontSize: 16, fontWeight: '700' }}>
                      {item.type === 'in' ? '→' : '←'}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.workerName}>{item.worker?.name}</Text>
                    <Text style={styles.workerRole}>{item.type === 'in' ? 'Check In' : 'Check Out'}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      item.status === 'approved' ? `${Colors.success}20` :
                      item.status === 'rejected' ? `${Colors.danger}20` : `${Colors.warning}20`
                  }]}>
                    <Text style={[styles.statusText, {
                      color:
                        item.status === 'approved' ? Colors.success :
                        item.status === 'rejected' ? Colors.danger : Colors.warning
                    }]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            )
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: Colors.bgBase },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  title:     { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:  { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  approveAllBtn: { backgroundColor: Colors.success, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  approveAllText:{ fontSize: Typography.sm, fontWeight: '700', color: Colors.white },

  tabs: { flexDirection: 'row', marginHorizontal: Spacing.base, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: 3, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive:    { backgroundColor: Colors.info },
  tabText:      { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive:{ color: Colors.white, fontWeight: '700' },

  list:  { padding: Spacing.base, paddingTop: 0, paddingBottom: 120 },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:{ fontSize: 52, marginBottom: 12 },
  emptyTitle:{ fontSize: Typography.lg, fontWeight: '700', color: Colors.textSecondary },
  emptySub:  { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },

  // Card
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  historyCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeEmoji:{ fontSize: 20, fontWeight: '700' },
  cardInfo: { flex: 1 },
  workerName:{ fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  workerRole:{ fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  typeBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  timeText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  dateText: { fontSize: Typography.xs, color: Colors.textMuted },
  notesBox: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.bgInput, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  notesText:{ fontSize: Typography.xs, color: Colors.textSecondary },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Actions
  actionRow:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider },
  rejectBtn:   { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: `${Colors.danger}10`, borderRightWidth: 1, borderRightColor: Colors.divider },
  approveBtn:  { flex: 2, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.success },
  rejectText:  { fontSize: Typography.base, fontWeight: '700', color: Colors.danger },
  approveText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
  btnDisabled: { opacity: 0.5 },
});
