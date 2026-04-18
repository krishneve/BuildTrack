import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BTButton from '../../components/common/BTButton';
import BTInput from '../../components/common/BTInput';
import PageHeader from '../../components/common/PageHeader';
import BTCard from '../../components/common/BTCard';
import { invoiceService } from '../../services/invoiceService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function UploadInvoiceScreen() {
  const { user } = useSelector((s) => s.auth);
  const nav = useNavigation();
  const siteId = user?.primarySite;

  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({ supplierName: '', amount: '', invoiceNumber: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const pickFromCamera = () => {
    launchCamera({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (!res.didCancel && res.assets?.[0]) setPhoto(res.assets[0]);
    });
  };

  const pickFromLibrary = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (!res.didCancel && res.assets?.[0]) setPhoto(res.assets[0]);
    });
  };

  const handleSubmit = async () => {
    if (!form.supplierName.trim()) { Alert.alert('Required', 'Enter supplier name'); return; }
    if (!form.amount || isNaN(form.amount)) { Alert.alert('Required', 'Enter a valid amount'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('siteId', siteId);
      fd.append('supplierName', form.supplierName);
      fd.append('amount', form.amount);
      fd.append('invoiceNumber', form.invoiceNumber);
      fd.append('notes', form.notes);
      if (photo) {
        fd.append('invoicePhoto', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || 'invoice.jpg',
        });
      }
      await invoiceService.uploadInvoice(siteId, fd);
      Alert.alert('Uploaded!', 'Invoice submitted for approval.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <PageHeader title="Upload Invoice" subtitle="Submit for manager approval" showBack />

      {/* Photo capture */}
      <BTCard style={styles.photoCard}>
        <Text style={styles.photoTitle}>Invoice Photo</Text>
        {photo ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
              <Text style={styles.retakeText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoBtns}>
            <BTButton label="Take Photo" icon="📷" variant="outline" size="md" onPress={pickFromCamera} style={{ flex: 1 }} />
            <BTButton label="From Gallery" icon="🖼" variant="outline" size="md" onPress={pickFromLibrary} style={{ flex: 1 }} />
          </View>
        )}
      </BTCard>

      {/* Form */}
      <View style={styles.formGap}>
        <BTInput label="Supplier Name *" value={form.supplierName}
          onChangeText={(t) => setForm(f => ({ ...f, supplierName: t }))}
          placeholder="e.g. Shree Cement Depot" />
        <BTInput label="Amount (₹) *" value={form.amount}
          onChangeText={(t) => setForm(f => ({ ...f, amount: t }))}
          keyboardType="numeric" placeholder="15000" />
        <BTInput label="Invoice Number" value={form.invoiceNumber}
          onChangeText={(t) => setForm(f => ({ ...f, invoiceNumber: t }))}
          placeholder="INV-2024-001" />
        <BTInput label="Notes" value={form.notes}
          onChangeText={(t) => setForm(f => ({ ...f, notes: t }))}
          placeholder="Details about this purchase..."
          multiline inputStyle={{ minHeight: 80, textAlignVertical: 'top' }} />
      </View>

      <BTButton
        label={submitting ? 'Uploading...' : 'Submit Invoice'}
        onPress={handleSubmit}
        loading={submitting}
        size="lg"
        icon="⬆"
        style={{ marginTop: Spacing.base }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  photoCard: { marginBottom: Spacing.base },
  photoTitle: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  photoBtns: { flexDirection: 'row', gap: Spacing.sm },
  photoPreviewWrap: { position: 'relative' },
  photoPreview: { width: '100%', height: 180, borderRadius: Radius.md, backgroundColor: Colors.bgInput },
  retakeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: `${Colors.danger}CC`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  retakeText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '600' },
  formGap: { gap: Spacing.base },
});
