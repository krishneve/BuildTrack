import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function BTInput({ label, error, style, inputStyle, ...props }) {
  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { 
    fontSize: Typography.sm, 
    color: Colors.textSecondary, 
    fontWeight: Typography.medium,
    fontFamily: Typography.fontFamily,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: Typography.fontFamily,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 50,
  },
  inputError: { borderWidth: 1, borderColor: Colors.danger },
  error: { 
    fontSize: Typography.xs, 
    color: Colors.danger, 
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily,
  },
});
