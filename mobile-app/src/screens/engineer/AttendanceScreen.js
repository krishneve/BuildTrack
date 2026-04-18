import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { engineerService } from '../../services/engineerService';
import { enqueue } from '../../services/offlineQueue';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';

// ... (STATUS_CFG remains same)

export default function AttendanceScreen() {
  // ... (useSelectors remains same)

  return (
    <ScreenWrapper scroll={false}>
      <View style={{ flex: 1, padding: Spacing.base }}>
        {/* Clock */}
        <ClockFace />

        {/* Today status */}
        <View style={styles.statusRow}>
          <StatusChip record={todayIn}  label="CHECK IN" />
          <StatusChip record={todayOut} label="CHECK OUT" />
        </View>

        {/* Optional notes */}
        {showNotes && (
          <View style={styles.notesWrap}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add a note (optional)..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        )}

        {/* Add note toggle */}
        <TouchableOpacity style={styles.noteToggle} onPress={() => setShowNotes(v => !v)}>
          <Text style={styles.noteToggleTxt}>{showNotes ? '— Hide notes' : '+ Add note'}</Text>
        </TouchableOpacity>

        {/* Check IN / OUT buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.checkBtn, styles.checkInBtn, (!canIn || marking) && styles.btnOff]}
            onPress={() => canIn && !marking && mark('in')}
            activeOpacity={canIn ? 0.8 : 1}
          >
            {marking === 'in' ? (
              <ActivityIndicator color={Colors.white} size="large" />
            ) : (
              <>
                <Text style={styles.checkBtnArrow}>→</Text>
                <Text style={styles.checkBtnLabel}>CHECK IN</Text>
                {!canIn && <Text style={styles.checkBtnSub}>Already marked</Text>}
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkBtn, styles.checkOutBtn, (!canOut || marking) && styles.btnOff]}
            onPress={() => canOut && !marking && mark('out')}
            activeOpacity={canOut ? 0.8 : 1}
          >
            {marking === 'out' ? (
              <ActivityIndicator color={Colors.white} size="large" />
            ) : (
              <>
                <Text style={styles.checkBtnArrow}>←</Text>
                <Text style={styles.checkBtnLabel}>CHECK OUT</Text>
                {!canOut && todayOut && <Text style={styles.checkBtnSub}>Already marked</Text>}
                {!canOut && !todayOut && <Text style={styles.checkBtnSub}>Check in first</Text>}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Offline note */}
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineTxt}>⚡ Offline — will sync automatically when connected</Text>
          </View>
        )}

        {/* History */}
        <Text style={styles.sectionLabel}>RECENT HISTORY</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
        ) : (
          <FlatList
            data={history.slice(0, 14)}
            keyExtractor={r => r._id?.toString() || r.date?.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            ListEmptyComponent={<Text style={styles.emptyTxt}>No attendance records yet</Text>}
            renderItem={({ item }) => {
              const cfg    = STATUS_CFG[item.status] || STATUS_CFG.pending;
              const isIn   = item.type === 'in';
              const dateStr = new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
              const timeStr = new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              return (
                <View style={styles.histItem}>
                  <View style={[styles.histArrow, { backgroundColor: isIn ? `${Colors.success}18` : `${Colors.danger}18` }]}>
                    <Text style={{ color: isIn ? Colors.success : Colors.danger, fontSize: 16, fontWeight: '700' }}>
                      {isIn ? '→' : '←'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histType}>{isIn ? 'Check In' : 'Check Out'}</Text>
                    <Text style={styles.histDate}>{dateStr} · {timeStr}</Text>
                  </View>
                  <View style={[styles.histBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.histBadgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgBase, padding: Spacing.base },

  clockFace:  { backgroundColor: Colors.white, borderRadius: Radius.lg, paddingVertical: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadow.md },
  clockTime:  { fontSize: 52, fontWeight: Typography.bold, color: Colors.textPrimary, letterSpacing: -1, lineHeight: 60, fontFamily: Typography.fontFamily },
  clockDate:  { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4, fontFamily: Typography.fontFamily },

  statusRow:  { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  chip:       { flex: 1, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: 6, ...Shadow.sm },
  chipEmpty:  { flex: 1, borderRadius: Radius.md, backgroundColor: Colors.white, padding: Spacing.md, alignItems: 'center', gap: 6, ...Shadow.sm },
  chipEmptyLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: Typography.fontFamily },
  chipEmptyValue: { fontSize: Typography.base, color: Colors.textMuted, fontFamily: Typography.fontFamily },
  chipStatus:     { fontSize: Typography.xs, fontWeight: Typography.bold, fontFamily: Typography.fontFamily },
  offlineTag:     { fontSize: Typography.xs, color: Colors.warning, fontWeight: Typography.semibold },

  notesWrap:  { backgroundColor: Colors.white, borderRadius: Radius.md, marginBottom: Spacing.md, ...Shadow.sm },
  notesInput: { padding: Spacing.base, color: Colors.textPrimary, fontSize: Typography.base, minHeight: 80, textAlignVertical: 'top', fontFamily: Typography.fontFamily },
  noteToggle: { alignSelf: 'flex-start', marginBottom: Spacing.md },
  noteToggleTxt: { fontSize: Typography.sm, color: Colors.primaryDark, fontWeight: Typography.semibold, fontFamily: Typography.fontFamily },

  btnRow:      { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  checkBtn:    { flex: 1, borderRadius: Radius.lg, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadow.md },
  checkInBtn:  { backgroundColor: Colors.success },
  checkOutBtn: { backgroundColor: Colors.primary }, // Use primary blue-grey for check out balance
  btnOff:      { opacity: 0.4 },
  checkBtnArrow:{ fontSize: 28, fontWeight: Typography.bold, color: Colors.white },
  checkBtnLabel:{ fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.white, fontFamily: Typography.fontFamily },
  checkBtnSub:  { fontSize: Typography.xs, color: `${Colors.white}CC`, fontFamily: Typography.fontFamily },

  offlineBanner: { backgroundColor: `${Colors.warning}15`, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  offlineTxt:    { fontSize: Typography.xs, color: Colors.warning, fontWeight: '600', textAlign: 'center' },

  sectionLabel:{ fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.md, marginTop: Spacing.lg, fontFamily: Typography.fontFamily },
  emptyTxt:    { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: Typography.sm, fontFamily: Typography.fontFamily },

  histItem:  { backgroundColor: Colors.white, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md, ...Shadow.sm },
  histArrow: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  histType:  { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, fontFamily: Typography.fontFamily },
  histDate:  { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, fontFamily: Typography.fontFamily },
  histBadge: { borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  histBadgeTxt: { fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.5 },
});
