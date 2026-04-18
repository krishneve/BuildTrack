import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { engineerService } from '../../services/engineerService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const CATEGORIES = ['materials', 'labor', 'equipment', 'overhead', 'other'];

export default function InvoiceUploadScreen() {
  const { user }      = useSelector(s => s.auth);
  const nav           = useNavigation();
  const siteId        = user?.primarySite;

  const [photo,       setPhoto]      = useState(null);
  const [supplierName,setSupplier]   = useState('');
  const [amount,      setAmount]     = useState('');
  const [gst,         setGst]        = useState('');
  const [invNumber,   setInvNumber]  = useState('');
  const [category,    setCategory]   = useState('materials');
  const [notes,       setNotes]      = useState('');
  const [submitting,  setSubmitting] = useState(false);

  const pickPhoto = (source) => {
    const opts = { mediaType: 'photo', quality: 0.8, includeBase64: false };
    const fn   = source === 'camera' ? launchCamera : launchImageLibrary;
    fn(opts, res => {
      if (!res.didCancel && res.assets?.[0]) setPhoto(res.assets[0]);
    });
  };

  const totalAmount = Number(amount || 0) + Number(gst || 0);

  const handleSubmit = async () => {
    if (!supplierName.trim()) { Alert.alert('Required', 'Supplier name is required'); return; }
    const amtNum = Number(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) { Alert.alert('Required', 'Enter a valid amount'); return; }

    setSubmitting(true);
    try {
      let payload;
      if (photo) {
        const fd = new FormData();
        fd.append('siteId',       siteId);
        fd.append('supplierName', supplierName.trim());
        fd.append('amount',       String(amtNum));
        fd.append('gst',          String(Number(gst || 0)));
        fd.append('invoiceNumber',invNumber.trim());
        fd.append('category',     category);
        fd.append('notes',        notes.trim());
        fd.append('photo', { uri: photo.uri, type: photo.type || 'image/jpeg', name: photo.fileName || 'invoice.jpg' });
        await engineerService.uploadInvoice(siteId, fd);
      } else {
        await engineerService.submitInvoice({ siteId, supplierName: supplierName.trim(), amount: amtNum, gst: Number(gst || 0), invoiceNumber: invNumber.trim(), category, notes: notes.trim() });
      }

      Alert.alert('Submitted ✓', 'Invoice sent to manager for approval.', [{ text: 'Done', onPress: () => nav.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.8}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upload Invoice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>

        {/* Photo capture */}
        <Text style={styles.label}>Invoice Photo (optional)</Text>
        {photo ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
              <Text style={styles.removePhotoTxt}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoBtns}>
            <TouchableOpacity style={[styles.photoBtn, styles.photoBtnCamera]} onPress={() => pickPhoto('camera')} activeOpacity={0.8}>
              <Text style={styles.photoBtnEmoji}>📷</Text>
              <Text style={styles.photoBtnTxt}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoBtn, styles.photoBtnGallery]} onPress={() => pickPhoto('library')} activeOpacity={0.8}>
              <Text style={styles.photoBtnEmoji}>🖼</Text>
              <Text style={styles.photoBtnTxt}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Supplier */}
        <Text style={styles.label}>Supplier Name *</Text>
        <TextInput
          style={styles.input}
          value={supplierName}
          onChangeText={setSupplier}
          placeholder="e.g. Ambuja Cements, Nashik"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
        />

        {/* Amount row */}
        <View style={styles.amtRow}>
          <View style={styles.amtField}>
            <Text style={styles.label}>Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="15000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.amtField}>
            <Text style={styles.label}>GST (₹)</Text>
            <TextInput
              style={styles.input}
              value={gst}
              onChangeText={setGst}
              placeholder="2700"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Total display */}
        {(amount || gst) ? (
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        ) : null}

        {/* Invoice number */}
        <Text style={styles.label}>Invoice Number (optional)</Text>
        <TextInput
          style={styles.input}
          value={invNumber}
          onChangeText={setInvNumber}
          placeholder="INV-2025-001"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catChipTxt, category === cat && { color: Colors.textInverse, fontWeight: '700' }]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Details about this purchase..."
          placeholderTextColor={Colors.textMuted}
          multiline
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!supplierName || !amount || submitting) && styles.submitOff]}
          onPress={handleSubmit}
          disabled={!supplierName || !amount || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="large" />
          ) : (
            <>
              <Text style={styles.submitEmoji}>⬆</Text>
              <Text style={styles.submitTxt}>SUBMIT INVOICE</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footNote}>
          Invoice will be reviewed and approved by the site manager.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bgBase },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backTxt: { fontSize: 18, color: Colors.textPrimary },
  title:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.base, paddingBottom: 60 },
  label:   { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: Spacing.base },

  photoBtns:      { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  photoBtn:       { flex: 1, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center', gap: 8, borderWidth: 1 },
  photoBtnCamera: { backgroundColor: `${Colors.engineer}10`, borderColor: `${Colors.engineer}35` },
  photoBtnGallery:{ backgroundColor: Colors.bgCard, borderColor: Colors.border },
  photoBtnEmoji:  { fontSize: 28 },
  photoBtnTxt:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  photoPreviewWrap: { position: 'relative', marginBottom: Spacing.sm },
  photoPreview:   { width: '100%', height: 180, borderRadius: Radius.lg, backgroundColor: Colors.bgInput },
  removePhotoBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: `${Colors.danger}CC`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  removePhotoTxt: { color: Colors.white, fontSize: Typography.xs, fontWeight: '700' },

  input:   { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: 13, color: Colors.textPrimary, fontSize: Typography.base },

  amtRow:  { flexDirection: 'row', gap: Spacing.sm },
  amtField:{ flex: 1 },

  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${Colors.engineer}12`, borderRadius: Radius.md, padding: Spacing.base, borderWidth: 1, borderColor: `${Colors.engineer}30`, marginBottom: Spacing.sm },
  totalLabel:{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  totalValue:{ fontSize: Typography.xl, fontWeight: '800', color: Colors.engineer },

  catScroll:     { marginBottom: Spacing.sm },
  catChip:       { backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipTxt:    { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },

  submitBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 18, gap: 12, marginTop: Spacing.base },
  submitOff:   { opacity: 0.35 },
  submitEmoji: { fontSize: 22, color: Colors.white },
  submitTxt:   { fontSize: Typography.lg, fontWeight: '800', color: Colors.textInverse, letterSpacing: 0.5 },
  footNote:    { fontSize: Typography.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.base, lineHeight: 18 },
});
