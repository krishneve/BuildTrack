import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../theme';

export default function BTCard({ children, style, noPad = false }) {
  return (
    <View style={[styles.card, noPad && { padding: 0 }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.md, // Use md shadow for a softer, more elevated feel
  },
});
