import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors, Radius, Typography, Spacing } from '../../theme';

// Large-touch button — designed for field workers with gloves
export default function BTButton({
  label, onPress, loading = false, disabled = false,
  variant = 'primary', size = 'lg', icon, style,
}) {
  const bg = {
    primary: Colors.primary,
    danger: Colors.danger,
    outline: 'transparent',
    ghost: 'transparent',
    success: Colors.success,
    info: Colors.info,
  }[variant] || Colors.primary;

  const textColor = ['outline', 'ghost'].includes(variant)
    ? (variant === 'outline' ? Colors.primaryDark : Colors.textSecondary)
    : Colors.textInverse;

  const borderColor = variant === 'outline' ? Colors.primaryLight : 'transparent';
  const height = size === 'lg' ? 54 : size === 'md' ? 46 : 38;
  const fontSize = size === 'lg' ? Typography.base : Typography.sm;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        { backgroundColor: bg, height, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.label, { color: textColor, fontSize }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: Spacing.sm },
  label: { 
    fontWeight: Typography.semibold, 
    letterSpacing: 0.1,
    fontFamily: Typography.fontFamily,
  },
  disabled: { opacity: 0.4 },
});
