import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService } from '../../services/notificationService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const TYPE_CFG = {
  attendance_pending:  { icon: '✓',  color: Colors.warning,  bg: `${Colors.warning}15` },
  attendance_approved: { icon: '✅', color: Colors.success,  bg: `${Colors.success}15` },
  attendance_rejected: { icon: '❌', color: Colors.danger,   bg: `${Colors.danger}15`  },
  payment_pending:     { icon: '₹',  color: Colors.warning,  bg: `${Colors.warning}15` },
  payment_approved:    { icon: '✅', color: Colors.success,  bg: `${Colors.success}15` },
  payment_rejected:    { icon: '❌', color: Colors.danger,   bg: `${Colors.danger}15`  },
  invoice_pending:     { icon: '◻', color: Colors.warning,  bg: `${Colors.warning}15` },
  invoice_approved:    { icon: '✅', color: Colors.success,  bg: `${Colors.success}15` },
  low_stock:           { icon: '⚠', color: Colors.danger,   bg: `${Colors.danger}15`  },
  budget_alert:        { icon: '⚠', color: Colors.warning,  bg: `${Colors.warning}15` },
  budget_overrun:      { icon: '🚨', color: Colors.danger,   bg: `${Colors.danger}15`  },
  system:              { icon: '●',  color: Colors.info,     bg: `${Colors.info}15`    },
};

function NotifCard({ item, onPress }) {
  const cfg = TYPE_CFG[item.type] || TYPE_CFG.system;
  const timeStr = new Date(item.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Text style={styles.iconText}>{cfg.icon}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.cardTime}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [unreadOnly,    setUnreadOnly]    = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationService.getAll({ unreadOnly: unreadOnly ? 'true' : 'false', limit: 50 });
      setNotifications(data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [unreadOnly]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const markRead = async (item) => {
    if (item.isRead) return;
    await notificationService.markRead(item._id).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.subtitle}>{unreadCount} unread</Text>}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.filterBtn, unreadOnly && styles.filterBtnActive]}
            onPress={() => setUnreadOnly(v => !v)}
          >
            <Text style={[styles.filterTxt, unreadOnly && { color: Colors.white }]}>
              Unread only
            </Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAllTxt}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.info} size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>{unreadOnly ? 'No unread notifications' : 'No notifications yet'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotifCard item={item} onPress={markRead} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgBase },
  header: { padding: Spacing.base },
  title:  { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.xs, color: Colors.warning, marginTop: 2, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginTop: Spacing.sm },
  filterBtn:       { backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  filterTxt:       { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  markAllTxt:      { fontSize: Typography.xs, fontWeight: '700', color: Colors.info },

  list:   { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  empty:  { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: Typography.md, fontWeight: '600', color: Colors.textSecondary },

  card:       { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.base, gap: Spacing.sm },
  cardUnread: { borderColor: `${Colors.info}40`, backgroundColor: `${Colors.info}06` },
  iconWrap:   { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  iconText:   { fontSize: 18 },
  cardContent:{ flex: 1 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardTitle:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.info, marginLeft: 6, flexShrink: 0 },
  cardMsg:    { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  cardTime:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
});
