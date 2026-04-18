// components/common/ToastContainer.js
// Renders floating in-app toasts for push notifications & sync events
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../store/slices/toastSlice';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const TYPE_CONFIG = {
  attendance_pending:  { icon: '✓', color: Colors.warning },
  attendance_approved: { icon: '✅', color: Colors.success },
  payment_approved:    { icon: '₹',  color: Colors.success },
  payment_rejected:    { icon: '✕',  color: Colors.danger },
  invoice_pending:     { icon: '◻', color: Colors.warning },
  low_stock:           { icon: '⚠', color: Colors.danger },
  budget_alert:        { icon: '⚠', color: Colors.warning },
  budget_overrun:      { icon: '🚨', color: Colors.danger },
  system:              { icon: '●',  color: Colors.info },
};

function Toast({ item }) {
  const dispatch  = useDispatch();
  const opacity   = React.useRef(new Animated.Value(0)).current;
  const cfg       = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => dispatch(removeToast(item.id)));
  }, []);

  return (
    <Animated.View style={[styles.toast, { opacity, borderLeftColor: cfg.color }]}>
      <Text style={[styles.icon, { color: cfg.color }]}>{cfg.icon}</Text>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {item.message && <Text style={styles.message} numberOfLines={2}>{item.message}</Text>}
      </View>
      <TouchableOpacity onPress={() => dispatch(removeToast(item.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ToastContainer() {
  const { items } = useSelector(s => s.toast);
  if (!items.length) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {items.map(item => <Toast key={item.id} item={item} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 0, right: 0,
    zIndex: 9999, paddingHorizontal: Spacing.base, gap: Spacing.sm,
  },
  toast: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  icon:    { fontSize: 20, marginTop: 1 },
  content: { flex: 1 },
  title:   { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  message: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  close:   { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
});
