import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';

export default function PageHeader({ title, subtitle, showBack = false, action }) {
  const nav = useNavigation();
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        </View>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: Radius.md, 
    backgroundColor: Colors.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadow.sm,
  },
  backIcon: { fontSize: 22, color: Colors.textPrimary, fontWeight: Typography.bold },
  title: { 
    fontSize: Typography.xl, 
    fontWeight: Typography.bold, 
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily,
    letterSpacing: -0.5,
  },
  sub: { 
    fontSize: Typography.sm, 
    color: Colors.textSecondary, 
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
});
