import React from 'react';
import { SafeAreaView, ScrollView, View, StatusBar, StyleSheet, Image } from 'react-native';
import { Colors, Spacing } from '../../theme';
import OfflineBanner from './OfflineBanner';

export default function ScreenWrapper({ children, scroll = true, style, noPadding = false }) {
  const inner = (
    <View style={[styles.inner, noPadding && { padding: 0 }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgBase} />
      
      {/* Subtle Construction Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image 
          source={require('../../assets/bg_pattern.png')}
          style={styles.bgIcon}
          resizeMode="cover"
        />
      </View>

      <OfflineBanner />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { 
    flex: 1, 
    padding: Spacing.base, // Use standardized spacing
  },
  bgIcon: {
    width: '100%',
    height: '100%',
    opacity: 0.06, // Very subtle as requested (5-8%)
    tintColor: Colors.primaryDark, // Soft tint to match theme
  },
});
