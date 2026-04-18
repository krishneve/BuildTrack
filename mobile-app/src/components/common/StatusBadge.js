import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

const CONFIG = {
  approved: { bg: Colors.successBg, text: Colors.success, label: 'Approved' },
  pending:  { bg: Colors.warningBg, text: Colors.warning, label: 'Pending' },
  rejected: { bg: Colors.dangerBg,  text: Colors.danger,  label: 'Rejected' },
  in:       { bg: Colors.infoBg,    text: Colors.info,    label: 'IN' },
  out:      { bg: Colors.dangerBg,  text: Colors.danger,  label: 'OUT' },
  active:   { bg: Colors.successBg, text: Colors.success, label: 'Active' },
};

export default function StatusBadge({ status, customLabel }) {
  const cfg = CONFIG[status?.toLowerCase()] || { bg: Colors.bgInput, text: Colors.textSecondary, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{customLabel || cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { 
    borderRadius: Radius.sm, // Slightly rounded but not pill if preferred, or keep pill
    paddingHorizontal: 12, 
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  text: { 
    fontSize: Typography.xs - 1, 
    fontWeight: Typography.semibold, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8,
    fontFamily: Typography.fontFamily,
  },
});
