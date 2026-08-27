import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, TouchableOpacity,
  Modal, ScrollView, Image, TextInput,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import SearchBar from '../../components/SearchBar';
import { Colors, Spacing, Radius } from '../../constants/Colors';

// ─── Constants ─────────────────────────────────────────────────────────────────
const GST_OPTIONS = ['0', '5', '12', '18', '28'];
const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'litre', 'ml', 'meter', 'cm', 'box', 'set', 'pair', 'roll'];

const INITIAL_FORM = {
  name: '', partNumber: '', company: '',
  description: '', specifications: '',
  categoryId: '', supplierId: '',
  location: '', unit: 'pcs', barcode: '',
  price: '', purchasePrice: '',
  gstPercent: '18', currentStock: '0', minStock: '0',
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ProductsScreen() {
  const [products, setProducts]       = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { colors } = useTheme();

  // Detail / Edit
  const [selected, setSelected]   = useState<any>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showForm, setShowForm]   = useState(false);

  // Meta (categories, suppliers)
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers]   = useState<any[]>([]);

  // Form state
  const [form, setForm]     = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  // Quick stock adjust
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct]     = useState<any>(null);
  const [adjQty, setAdjQty]     = useState('');
  const [adjType, setAdjType]   = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [adjReason, setAdjReason] = useState('Stock Correction');
  const [adjSaving, setAdjSaving] = useState(false);

  // ─── Data ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (p = 1, q = search, isRefresh = false) => {
    if (p === 1) isRefresh ? setRefreshing(true) : setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await api.get('/products', {
        params: { search: q, page: p, limit: 20 },
      });
      if (p === 1) setProducts(data.products);
      else setProducts(prev => [...prev, ...data.products]);
      setTotal(data.total);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, []);

  const loadMeta = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/categories'), api.get('/suppliers'),
      ]);
      setCategories(catRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(1, search); }, [search]);
  useEffect(() => { loadMeta(); }, []);

  // ─── CRUD helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditProduct(null);
    setForm({ ...INITIAL_FORM });
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name:           p.name            || '',
      partNumber:     p.partNumber      || '',
      company:        p.company         || '',
      description:    p.description     || '',
      specifications: p.specifications  || '',
      categoryId:     p.categoryId      || '',
      supplierId:     p.supplierId      || '',
      location:       p.location        || '',
      unit:           p.unit            || 'pcs',
      barcode:        p.barcode         || '',
      price:          String(p.price          || ''),
      purchasePrice:  String(p.purchasePrice  || ''),
      gstPercent:     String(p.gstPercent     || '18'),
      currentStock:   String(p.currentStock   || '0'),
      minStock:       String(p.minStock       || '0'),
    });
    setSelected(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Product name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:           form.name.trim(),
        partNumber:     form.partNumber.trim()     || null,
        company:        form.company.trim()        || null,
        description:    form.description.trim()    || null,
        specifications: form.specifications.trim() || null,
        categoryId:     form.categoryId            || null,
        supplierId:     form.supplierId            || null,
        location:       form.location.trim()       || null,
        unit:           form.unit,
        barcode:        form.barcode.trim()        || null,
        price:          form.price                 || '0',
        purchasePrice:  form.purchasePrice         || '0',
        gstPercent:     form.gstPercent            || '18',
        currentStock:   form.currentStock          || '0',
        minStock:       form.minStock              || '0',
      };

      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, payload);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        await api.post('/products', payload);
        Alert.alert('Success', 'Product added successfully!');
      }
      setShowForm(false);
      load(1, search, true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not save product.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: any) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${p.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${p.id}`);
              setSelected(null);
              load(1, search, true);
            } catch {
              Alert.alert('Error', 'Could not delete product.');
            }
          },
        },
      ]
    );
  };

  const openQuickStock = (p: any) => {
    setStockProduct(p);
    setAdjQty('');
    setAdjType('INCREASE');
    setAdjReason('Stock Correction');
    setSelected(null);
    setShowStockModal(true);
  };

  const handleQuickStock = async () => {
    const qty = parseInt(adjQty);
    if (!stockProduct || isNaN(qty) || qty <= 0) {
      Alert.alert('Validation', 'Enter a valid quantity.');
      return;
    }
    setAdjSaving(true);
    try {
      await api.post('/adjustments', {
        productId: stockProduct.id,
        type: adjType,
        quantity: qty,
        reason: adjReason.trim() || 'Stock Correction',
      });
      Alert.alert('Done', 'Stock updated!');
      setShowStockModal(false);
      load(1, search, true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not adjust stock.');
    } finally {
      setAdjSaving(false);
    }
  };

  // ─── UI helpers ────────────────────────────────────────────────────────────
  const stockBadge = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: Colors.red,    bg: 'rgba(239,68,68,0.12)' };
    if (qty < 10) return { label: `${qty} low`,   color: Colors.yellow, bg: 'rgba(245,158,11,0.12)' };
    return            { label: `${qty} units`,     color: Colors.green,  bg: 'rgba(16,185,129,0.12)' };
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Products</Text>
          <Text style={[styles.count, { color: colors.textMuted }]}>{total.toLocaleString('en-IN')} items</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <SearchBar
            value={search}
            onChangeText={v => { setSearch(v); setPage(1); }}
            placeholder="Search products, part number..."
          />
        }
        renderItem={({ item }) => {
          const s = stockBadge(item.currentStock);
          const img = item.productImages?.[0] || item.designImages?.[0];
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              {img ? (
                <Image source={{ uri: img }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumbPlaceholder, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <Feather name="package" size={22} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                {item.partNumber ? (
                  <Text style={[styles.cardSub, { color: colors.textMuted }]}>Part: {item.partNumber}</Text>
                ) : item.category?.name ? (
                  <Text style={[styles.cardSub, { color: colors.textMuted }]}>{item.category.name}</Text>
                ) : null}
                {item.price ? (
                  <Text style={[styles.cardPrice, { color: colors.green }]}>
                    ₹{Number(item.price).toLocaleString('en-IN')}
                  </Text>
                ) : null}
              </View>
              <View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
                    onPress={() => openEdit(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                  >
                    <Feather name="edit-2" size={14} color={colors.accentLight} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)' }]}
                    onPress={() => handleDelete(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  >
                    <Feather name="trash-2" size={14} color={colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(1, search, true)}
            tintColor={Colors.accent}
          />
        }
        onEndReached={() => {
          if (products.length < total && !loadingMore) load(page + 1, search);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator color={Colors.accent} style={{ marginVertical: 16 }} />
            : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="package" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyAddText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      )}

      {/* Product Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <ProductDetail
            product={selected}
            onClose={() => setSelected(null)}
            onEdit={() => openEdit(selected)}
            onDelete={() => handleDelete(selected)}
            onStockAdjust={() => openQuickStock(selected)}
          />
        )}
      </Modal>

      {/* Add / Edit Product Form */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <ProductForm
          editProduct={editProduct}
          form={form}
          setForm={setForm}
          categories={categories}
          suppliers={suppliers}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      {/* Quick Stock Adjust Modal */}
      <Modal visible={showStockModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.quickSheet}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.quickHeader}>
              <View>
                <Text style={styles.quickTitle}>Quick Stock Adjust</Text>
                {stockProduct && (
                  <Text style={styles.quickSub} numberOfLines={1}>{stockProduct.name}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowStockModal(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickBody}>
              {/* Type Toggle */}
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, adjType === 'INCREASE' && styles.typeBtnInc]}
                  onPress={() => setAdjType('INCREASE')}
                >
                  <Feather name="plus-circle" size={16} color={adjType === 'INCREASE' ? '#10b981' : Colors.textMuted} />
                  <Text style={[styles.typeTxt, adjType === 'INCREASE' && { color: '#10b981', fontWeight: '700' }]}>
                    Increase
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, adjType === 'DECREASE' && styles.typeBtnDec]}
                  onPress={() => setAdjType('DECREASE')}
                >
                  <Feather name="minus-circle" size={16} color={adjType === 'DECREASE' ? '#ef4444' : Colors.textMuted} />
                  <Text style={[styles.typeTxt, adjType === 'DECREASE' && { color: '#ef4444', fontWeight: '700' }]}>
                    Decrease
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity */}
              <Text style={styles.inputLabel}>Quantity *</Text>
              <TextInput
                style={styles.textInput}
                value={adjQty}
                onChangeText={setAdjQty}
                placeholder="Enter quantity"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />

              {/* Reason */}
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={styles.textInput}
                value={adjReason}
                onChangeText={setAdjReason}
                placeholder="Reason for adjustment"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.quickFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowStockModal(false)}
              >
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, adjSaving && { opacity: 0.7 }]}
                onPress={handleQuickStock}
                disabled={adjSaving}
              >
                {adjSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveTxt}>Apply</Text>
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Product Detail ─────────────────────────────────────────────────────────────
function ProductDetail({
  product: p,
  onClose,
  onEdit,
  onDelete,
  onStockAdjust,
}: {
  product: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStockAdjust: () => void;
}) {
  const imgs = [...(p.productImages ?? []), ...(p.designImages ?? [])];
  const rows = [
    { label: 'Part Number',    value: p.partNumber },
    { label: 'Company',        value: p.company },
    { label: 'Category',       value: p.category?.name },
    { label: 'Supplier',       value: p.supplier?.name },
    { label: 'Location',       value: p.location },
    { label: 'Unit',           value: p.unit },
    { label: 'GST',            value: p.gstPercent ? `${p.gstPercent}%` : null },
    { label: 'HSN Code',       value: p.hsnCode },
    { label: 'Barcode',        value: p.barcode },
    { label: 'Min Stock',      value: p.minStock != null ? String(p.minStock) : null },
    { label: 'Purchase Price', value: p.purchasePrice ? `₹${Number(p.purchasePrice).toLocaleString('en-IN')}` : null },
  ].filter(r => r.value);

  return (
    <SafeAreaView style={dtStyles.root}>
      {/* Header */}
      <View style={dtStyles.header}>
        <Text style={dtStyles.title} numberOfLines={2}>{p.name}</Text>
        <View style={dtStyles.headerActions}>
          <TouchableOpacity onPress={onEdit} style={dtStyles.editBtn}>
            <Feather name="edit-2" size={16} color={Colors.accentLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={dtStyles.closeBtn}>
            <Feather name="x" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={dtStyles.body}>
        {/* Image */}
        {imgs[0] ? (
          <Image source={{ uri: imgs[0] }} style={dtStyles.img} />
        ) : (
          <View style={dtStyles.imgPlaceholder}>
            <Feather name="package" size={48} color={Colors.textMuted} />
          </View>
        )}

        {/* Stock stats row */}
        <View style={dtStyles.statsRow}>
          <TouchableOpacity style={dtStyles.statBox} onPress={onStockAdjust} activeOpacity={0.8}>
            <Text style={dtStyles.statVal}>{p.currentStock ?? 0}</Text>
            <Text style={dtStyles.statLabel}>In Stock</Text>
            <View style={dtStyles.adjustHint}>
              <Feather name="refresh-cw" size={10} color={Colors.accentLight} />
              <Text style={dtStyles.adjustHintTxt}>Adjust</Text>
            </View>
          </TouchableOpacity>
          <View style={dtStyles.statBox}>
            <Text style={[dtStyles.statVal, { color: Colors.green }]}>
              {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
            </Text>
            <Text style={dtStyles.statLabel}>Sale Price</Text>
          </View>
          <View style={dtStyles.statBox}>
            <Text style={[dtStyles.statVal, { color: Colors.purple }]}>
              {p.gstPercent ? `${p.gstPercent}%` : '—'}
            </Text>
            <Text style={dtStyles.statLabel}>GST</Text>
          </View>
        </View>

        {/* Field rows */}
        {rows.map(r => (
          <View key={r.label} style={dtStyles.row}>
            <Text style={dtStyles.rowLabel}>{r.label}</Text>
            <Text style={dtStyles.rowValue}>{r.value}</Text>
          </View>
        ))}

        {p.specifications ? (
          <View style={dtStyles.textBox}>
            <Text style={dtStyles.textBoxTitle}>Specifications</Text>
            <Text style={dtStyles.textBoxContent}>{p.specifications}</Text>
          </View>
        ) : null}

        {p.description ? (
          <View style={dtStyles.textBox}>
            <Text style={dtStyles.textBoxTitle}>Description</Text>
            <Text style={dtStyles.textBoxContent}>{p.description}</Text>
          </View>
        ) : null}

        {/* Delete button */}
        <TouchableOpacity style={dtStyles.deleteBtn} onPress={onDelete}>
          <Feather name="trash-2" size={16} color={Colors.red} />
          <Text style={dtStyles.deleteTxt}>Delete Product</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Product Form (Add / Edit) ─────────────────────────────────────────────────
function ProductForm({
  editProduct, form, setForm, categories, suppliers, saving, onSave, onClose,
}: {
  editProduct: any;
  form: typeof INITIAL_FORM;
  setForm: (f: any) => void;
  categories: any[];
  suppliers: any[];
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [showCatPicker, setShowCatPicker]   = useState(false);
  const [showSupPicker, setShowSupPicker]   = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [supSearch, setSupSearch] = useState('');

  const selectedCat = categories.find(c => c.id === form.categoryId);
  const selectedSup = suppliers.find(s => s.id === form.supplierId);

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredSups = suppliers.filter(s =>
    s.name.toLowerCase().includes(supSearch.toLowerCase())
  );

  const f = (key: keyof typeof INITIAL_FORM) => (val: string) =>
    setForm((prev: any) => ({ ...prev, [key]: val }));

  return (
    <SafeAreaView style={fStyles.root}>
      {/* Form Header */}
      <View style={fStyles.header}>
        <TouchableOpacity onPress={onClose} style={fStyles.closeBtn}>
          <Feather name="x" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={fStyles.title}>{editProduct ? 'Edit Product' : 'Add Product'}</Text>
        <TouchableOpacity
          style={[fStyles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={onSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={fStyles.saveTxt}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={fStyles.body} showsVerticalScrollIndicator={false}>

          {/* ── Basic Info ────────────────────────────────── */}
          <SectionHeader title="Basic Information" />

          <FormField label="Product Name *">
            <TextInput
              style={fStyles.input}
              value={form.name}
              onChangeText={f('name')}
              placeholder="Enter product name"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>

          <FormField label="Company / Brand">
            <TextInput
              style={fStyles.input}
              value={form.company}
              onChangeText={f('company')}
              placeholder="Manufacturer or brand name"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>

          <FormField label="Category">
            <TouchableOpacity
              style={fStyles.picker}
              onPress={() => setShowCatPicker(true)}
            >
              <Text style={[fStyles.pickerTxt, !selectedCat && { color: Colors.textMuted }]}>
                {selectedCat ? selectedCat.name : 'Select category'}
              </Text>
              <Feather name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </FormField>

          <FormField label="Supplier">
            <TouchableOpacity
              style={fStyles.picker}
              onPress={() => setShowSupPicker(true)}
            >
              <Text style={[fStyles.pickerTxt, !selectedSup && { color: Colors.textMuted }]}>
                {selectedSup ? selectedSup.name : 'Select supplier'}
              </Text>
              <Feather name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </FormField>

          <FormField label="Location / Shelf No.">
            <TextInput
              style={fStyles.input}
              value={form.location}
              onChangeText={f('location')}
              placeholder="e.g. A-12, Shelf 3"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>

          {/* ── Identification ────────────────────────────── */}
          <SectionHeader title="Identification" />

          <FormField label="Part Number">
            <TextInput
              style={fStyles.input}
              value={form.partNumber}
              onChangeText={f('partNumber')}
              placeholder="Manufacturer part number"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
          </FormField>

          <FormField label="Barcode">
            <TextInput
              style={fStyles.input}
              value={form.barcode}
              onChangeText={f('barcode')}
              placeholder="Barcode / QR value"
              placeholderTextColor={Colors.textMuted}
            />
          </FormField>

          <FormField label="Unit">
            <TouchableOpacity
              style={fStyles.picker}
              onPress={() => setShowUnitPicker(true)}
            >
              <Text style={fStyles.pickerTxt}>{form.unit}</Text>
              <Feather name="chevron-down" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </FormField>

          {/* ── Pricing & Stock ───────────────────────────── */}
          <SectionHeader title="Pricing & Stock" />

          <View style={fStyles.row2}>
            <FormField label="Selling Price (₹)" flex>
              <TextInput
                style={fStyles.input}
                value={form.price}
                onChangeText={f('price')}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </FormField>
            <FormField label="Purchase Price (₹)" flex>
              <TextInput
                style={fStyles.input}
                value={form.purchasePrice}
                onChangeText={f('purchasePrice')}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </FormField>
          </View>

          <FormField label="GST %">
            <View style={fStyles.gstRow}>
              {GST_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[fStyles.gstChip, form.gstPercent === g && fStyles.gstChipActive]}
                  onPress={() => setForm((prev: any) => ({ ...prev, gstPercent: g }))}
                >
                  <Text style={[fStyles.gstChipTxt, form.gstPercent === g && fStyles.gstChipTxtActive]}>
                    {g}%
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Custom GST input */}
              <TextInput
                style={[fStyles.gstCustomInput, !GST_OPTIONS.includes(form.gstPercent) && fStyles.gstCustomActive]}
                value={GST_OPTIONS.includes(form.gstPercent) ? '' : form.gstPercent}
                onChangeText={v => setForm((prev: any) => ({ ...prev, gstPercent: v }))}
                placeholder="Custom"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </FormField>

          <View style={fStyles.row2}>
            <FormField label="Current Stock" flex>
              <TextInput
                style={fStyles.input}
                value={form.currentStock}
                onChangeText={f('currentStock')}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </FormField>
            <FormField label="Min Stock (alert)" flex>
              <TextInput
                style={fStyles.input}
                value={form.minStock}
                onChangeText={f('minStock')}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </FormField>
          </View>

          {/* ── Details ───────────────────────────────────── */}
          <SectionHeader title="Details" />

          <FormField label="Specifications">
            <TextInput
              style={[fStyles.input, fStyles.textarea]}
              value={form.specifications}
              onChangeText={f('specifications')}
              placeholder="Technical specs, dimensions, material..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </FormField>

          <FormField label="Description">
            <TextInput
              style={[fStyles.input, fStyles.textarea]}
              value={form.description}
              onChangeText={f('description')}
              placeholder="Product description..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </FormField>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <Modal visible={showCatPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={fStyles.pickerSheet}>
            <View style={fStyles.pickerModalHeader}>
              <Text style={fStyles.pickerModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCatPicker(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={fStyles.searchRow}>
              <Feather name="search" size={14} color={Colors.textMuted} />
              <TextInput
                style={fStyles.searchInput}
                value={catSearch}
                onChangeText={setCatSearch}
                placeholder="Search..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <TouchableOpacity
              style={fStyles.pickerItem}
              onPress={() => { setForm((p: any) => ({ ...p, categoryId: '' })); setShowCatPicker(false); }}
            >
              <Text style={fStyles.pickerItemTxt}>— None —</Text>
            </TouchableOpacity>
            <ScrollView>
              {filteredCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[fStyles.pickerItem, form.categoryId === c.id && fStyles.pickerItemActive]}
                  onPress={() => { setForm((p: any) => ({ ...p, categoryId: c.id })); setShowCatPicker(false); }}
                >
                  <Text style={[fStyles.pickerItemTxt, form.categoryId === c.id && fStyles.pickerItemTxtActive]}>
                    {c.name}
                  </Text>
                  {form.categoryId === c.id && <Feather name="check" size={14} color={Colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supplier Picker Modal */}
      <Modal visible={showSupPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={fStyles.pickerSheet}>
            <View style={fStyles.pickerModalHeader}>
              <Text style={fStyles.pickerModalTitle}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupPicker(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={fStyles.searchRow}>
              <Feather name="search" size={14} color={Colors.textMuted} />
              <TextInput
                style={fStyles.searchInput}
                value={supSearch}
                onChangeText={setSupSearch}
                placeholder="Search..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <TouchableOpacity
              style={fStyles.pickerItem}
              onPress={() => { setForm((p: any) => ({ ...p, supplierId: '' })); setShowSupPicker(false); }}
            >
              <Text style={fStyles.pickerItemTxt}>— None —</Text>
            </TouchableOpacity>
            <ScrollView>
              {filteredSups.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[fStyles.pickerItem, form.supplierId === s.id && fStyles.pickerItemActive]}
                  onPress={() => { setForm((p: any) => ({ ...p, supplierId: s.id })); setShowSupPicker(false); }}
                >
                  <Text style={[fStyles.pickerItemTxt, form.supplierId === s.id && fStyles.pickerItemTxtActive]}>
                    {s.name}
                  </Text>
                  {form.supplierId === s.id && <Feather name="check" size={14} color={Colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unit Picker Modal */}
      <Modal visible={showUnitPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={fStyles.pickerSheet}>
            <View style={fStyles.pickerModalHeader}>
              <Text style={fStyles.pickerModalTitle}>Select Unit</Text>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {UNIT_OPTIONS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[fStyles.pickerItem, form.unit === u && fStyles.pickerItemActive]}
                  onPress={() => { setForm((p: any) => ({ ...p, unit: u })); setShowUnitPicker(false); }}
                >
                  <Text style={[fStyles.pickerItemTxt, form.unit === u && fStyles.pickerItemTxtActive]}>{u}</Text>
                  {form.unit === u && <Feather name="check" size={14} color={Colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Small helpers ──────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={fStyles.sectionHeader}>{title.toUpperCase()}</Text>
  );
}

function FormField({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[fStyles.fieldGroup, flex && { flex: 1 }]}>
      <Text style={fStyles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
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
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  count: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  thumb: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.bgSecondary },
  thumbPlaceholder: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardSub:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: Colors.green, marginTop: 3 },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-end', marginBottom: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  actionBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.accentGlow,
    borderWidth: 1, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 9, marginTop: 4,
  },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },

  // Quick Stock sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  quickSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10,
  },
  quickHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  quickTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  quickSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  quickBody:  { padding: Spacing.xl, gap: Spacing.lg },
  quickFooter: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  inputLabel:  { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  textInput: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: 10, backgroundColor: Colors.bgSecondary,
  },
  typeBtnInc: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)' },
  typeBtnDec: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)' },
  typeTxt: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '700' },
});

const dtStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgCard },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: Spacing.xl, paddingBottom: 40 },
  img: { width: '100%', height: 220, borderRadius: Radius.lg, marginBottom: Spacing.lg, backgroundColor: Colors.bgSecondary },
  imgPlaceholder: {
    width: '100%', height: 160,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  adjustHint: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 4,
    backgroundColor: Colors.accentGlow,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.accent,
  },
  adjustHintTxt: { fontSize: 9, fontWeight: '700', color: Colors.accentLight },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: 13, color: Colors.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
  textBox: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  textBoxTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  textBoxContent: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 28,
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Radius.md, paddingVertical: 12,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  deleteTxt: { fontSize: 14, fontWeight: '700', color: Colors.red },
});

const fStyles = StyleSheet.create({
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
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: Radius.md,
    minWidth: 64, alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  body: { padding: Spacing.lg, gap: Spacing.md },
  sectionHeader: {
    fontSize: 11, fontWeight: '700',
    color: Colors.textMuted, letterSpacing: 0.8,
    marginTop: Spacing.lg, marginBottom: 4,
  },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 12,
  },
  pickerTxt: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  row2: { flexDirection: 'row', gap: Spacing.md },
  gstRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gstChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  gstChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  gstChipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  gstChipTxtActive: { color: Colors.accentLight, fontWeight: '700' },
  gstCustomInput: {
    width: 72, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    color: Colors.textPrimary, fontSize: 13, textAlign: 'center',
  },
  gstCustomActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },

  // Picker Modal
  pickerModal: {
    flex: 1, justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.xl,
  },
  pickerSheet: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  pickerModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerModalTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bgSecondary,
    margin: Spacing.md, borderRadius: Radius.md,
    paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: 8, fontSize: 13 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerItemActive: { backgroundColor: Colors.accentGlow },
  pickerItemTxt: { fontSize: 14, color: Colors.textPrimary },
  pickerItemTxtActive: { color: Colors.accentLight, fontWeight: '700' },
});
