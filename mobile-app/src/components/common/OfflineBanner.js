import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Colors } from '../../theme';

export default function OfflineBanner() {
  const { isConnected, pendingCount } = useSelector((state) => state.network);
  if (isConnected) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚡ Offline Mode{pendingCount > 0 ? ` · ${pendingCount} actions pending sync` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warning,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: { color: Colors.textInverse, fontSize: 12, fontWeight: '600' },
});
