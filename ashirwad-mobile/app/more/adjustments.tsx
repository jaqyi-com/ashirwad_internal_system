import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Adjustment {
  id: string;
  type: 'INCREASE' | 'DECREASE';
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  product: {
    name: string;
    sku?: string;
  };
  adjustedBy?: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
}

export default function AdjustmentsScreen() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form fields
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjType, setAdjType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Stock Correction');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Product selection list
  const [prodSearch, setProdSearch] = useState('');
  const [showProdPicker, setShowProdPicker] = useState(false);

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const { data } = await api.get('/adjustments');
      setAdjustments(data);
    } catch (err) {
      console.error('Fetch adjustments failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      // Normalize different formats
      const list = data.products || data;
      if (Array.isArray(list)) {
        setProducts(list);
      }
    } catch (err) {
      console.error('Fetch products failed:', err);
    }
  };

  const handleOpenForm = () => {
    setSelectedProductId('');
    setProdSearch('');
    setAdjType('INCREASE');
    setQuantity('');
    setReason('Stock Correction');
    setNotes('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedProductId) {
      Alert.alert('Validation Error', 'Please select a product.');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive quantity.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Reason is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productId: selectedProductId,
        type: adjType,
        quantity: qty,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      await api.post('/adjustments', payload);
      setModalVisible(false);
      fetchAdjustments();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not adjust stock. Verify inventory levels.';
      Alert.alert('Adjustment Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Adjustments</Text>
        <TouchableOpacity onPress={handleOpenForm} style={styles.addBtn}>
          <Feather name="sliders" size={18} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : adjustments.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noDataText}>No stock adjustments found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {adjustments.map(adj => (
            <View key={adj.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{adj.product?.name}</Text>
                  {adj.product?.sku ? (
                    <Text style={styles.prodSku}>SKU: {adj.product.sku}</Text>
                  ) : null}
                </View>
                <View style={[
                  styles.qtyTag,
                  adj.type === 'INCREASE' ? styles.qtyIncrease : styles.qtyDecrease
                ]}>
                  <Text style={[
                    styles.qtyText,
                    adj.type === 'INCREASE' ? styles.qtyTextIncrease : styles.qtyTextDecrease
                  ]}>
                    {adj.type === 'INCREASE' ? '+' : '-'}{adj.quantity}
                  </Text>
                </View>
              </View>

              <View style={styles.details}>
                <Text style={styles.reasonText}><Text style={{ fontWeight: '700' }}>Reason:</Text> {adj.reason}</Text>
                {adj.notes ? (
                  <Text style={styles.notesText}><Text style={{ fontWeight: '700' }}>Notes:</Text> {adj.notes}</Text>
                ) : null}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerMeta}>
                  By {adj.adjustedBy?.name || 'Unknown'} · {formatDate(adj.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Adjust Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalRoot}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Stock Adjustment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              {/* Product Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Product *</Text>
                <TouchableOpacity 
                  style={styles.pickerTrigger} 
                  onPress={() => setShowProdPicker(true)}
                >
                  <Text style={[
                    styles.pickerTriggerText,
                    selectedProduct && { color: Colors.textPrimary }
                  ]}>
                    {selectedProduct ? `${selectedProduct.name} (Stock: ${selectedProduct.currentStock})` : 'Choose a product...'}
                  </Text>
                  <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Adjustment Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adjustment Type *</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, adjType === 'INCREASE' && styles.typeBtnIncreaseActive]}
                    onPress={() => setAdjType('INCREASE')}
                  >
                    <Feather name="plus-circle" size={16} color={adjType === 'INCREASE' ? '#10b981' : Colors.textSecondary} />
                    <Text style={[styles.typeBtnText, adjType === 'INCREASE' && styles.typeBtnTextIncreaseActive]}>Increase Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, adjType === 'DECREASE' && styles.typeBtnDecreaseActive]}
                    onPress={() => setAdjType('DECREASE')}
                  >
                    <Feather name="minus-circle" size={16} color={adjType === 'DECREASE' ? '#ef4444' : Colors.textSecondary} />
                    <Text style={[styles.typeBtnText, adjType === 'DECREASE' && styles.typeBtnTextDecreaseActive]}>Decrease Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter adjustment count"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              {/* Reason */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason *</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Broken packaging, stock count mismatch"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional context/details..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Apply Adjustment</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Nested Product Search Picker Modal */}
      <Modal visible={showProdPicker} transparent animationType="fade">
        <View style={styles.prodPickerRoot}>
          <View style={styles.prodPickerContainer}>
            <View style={styles.prodPickerHeader}>
              <Text style={styles.prodPickerTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProdPicker(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.prodSearchRow}>
              <Feather name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.prodSearchInput}
                value={prodSearch}
                onChangeText={setProdSearch}
                placeholder="Search by name or SKU..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
            </View>
            <ScrollView contentContainerStyle={styles.prodList}>
              {filteredProducts.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.prodRow}
                  onPress={() => {
                    setSelectedProductId(p.id);
                    setShowProdPicker(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodRowName}>{p.name}</Text>
                    {p.sku ? <Text style={styles.prodRowSku}>SKU: {p.sku}</Text> : null}
                  </View>
                  <Text style={styles.prodRowStock}>Stock: {p.currentStock}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    width: 32, height: 32, borderRadius: Radius.md,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { color: Colors.textMuted, fontSize: 14 },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  prodName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  prodSku: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  qtyTag: {
    borderRadius: Radius.md,
    paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 44, alignItems: 'center',
  },
  qtyIncrease: { backgroundColor: 'rgba(16,185,129,0.12)' },
  qtyDecrease: { backgroundColor: 'rgba(239,110,110,0.12)' },
  qtyText: { fontSize: 13, fontWeight: '700' },
  qtyTextIncrease: { color: '#10b981' },
  qtyTextDecrease: { color: '#ef4444' },
  details: { marginVertical: Spacing.md, gap: 4 },
  reasonText: { fontSize: 13, color: Colors.textPrimary },
  notesText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  footer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  footerMeta: { fontSize: 11, color: Colors.textMuted },

  // Modal Styles
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: Spacing.lg },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgSecondary, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 12,
  },
  pickerTriggerText: { color: Colors.textMuted, fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: 10, backgroundColor: Colors.bgSecondary,
  },
  typeBtnIncreaseActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)' },
  typeBtnDecreaseActive: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextIncreaseActive: { color: '#10b981', fontWeight: '700' },
  typeBtnTextDecreaseActive: { color: '#ef4444', fontWeight: '700' },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  // Picker Modal
  prodPickerRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.xl },
  prodPickerContainer: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    maxHeight: '80%', padding: Spacing.lg,
  },
  prodPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  prodPickerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  prodSearchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: Radius.md,
    paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  prodSearchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: 8, fontSize: 13 },
  prodList: { gap: 8 },
  prodRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  prodRowName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prodRowSku: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  prodRowStock: { fontSize: 13, fontWeight: '700', color: Colors.accentLight },
});
