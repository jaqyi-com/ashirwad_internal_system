import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, TouchableOpacity,
  Modal, ScrollView, Image, TextInput,
  Alert, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import SearchBar from '../../components/SearchBar';
import { Colors, Spacing, Radius } from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  productImages: [] as string[],
  designImages: [] as string[],
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
  const { colors, isDark } = useTheme();

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
      if (p === 1) setProducts(data.products || []);
      else setProducts(prev => [...prev, ...(data.products || [])]);
      setTotal(data.total || 0);
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
    setForm({ ...INITIAL_FORM, productImages: [], designImages: [] });
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
      productImages:  Array.isArray(p.productImages) ? [...p.productImages] : [],
      designImages:   Array.isArray(p.designImages)  ? [...p.designImages]  : [],
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
        productImages:  form.productImages,
        designImages:   form.designImages,
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

  const stockBadge = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: Colors.red,    bg: 'rgba(239,68,68,0.12)' };
    if (qty < 10) return { label: `${qty} low`,   color: Colors.yellow, bg: 'rgba(245,158,11,0.12)' };
    return            { label: `${qty} units`,     color: Colors.green,  bg: 'rgba(16,185,129,0.12)' };
  };

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
          const imgCount = (item.productImages?.length || 0) + (item.designImages?.length || 0);

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={styles.thumbWrapper}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumbPlaceholder, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Feather name="package" size={22} color={colors.textMuted} />
                  </View>
                )}
                {imgCount > 0 && (
                  <View style={styles.imgBadge}>
                    <Feather name="camera" size={9} color="#fff" />
                    <Text style={styles.imgBadgeTxt}>{imgCount}</Text>
                  </View>
                )}
              </View>

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
            tintColor={colors.accent}
          />
        }
        onEndReached={() => {
          if (products.length < total && !loadingMore) load(page + 1, search);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
            : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
              <TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: colors.accent }]} onPress={openAdd}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyAddText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.bgPrimary }]}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {/* Product Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
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
            style={[styles.quickSheet, { backgroundColor: colors.bgCard }]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.quickHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>Quick Stock Adjust</Text>
                {stockProduct && (
                  <Text style={[styles.quickSub, { color: colors.textMuted }]} numberOfLines={1}>{stockProduct.name}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowStockModal(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickBody}>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, adjType === 'INCREASE' && styles.typeBtnInc]}
                  onPress={() => setAdjType('INCREASE')}
                >
                  <Feather name="plus-circle" size={16} color={adjType === 'INCREASE' ? '#10b981' : colors.textMuted} />
                  <Text style={[styles.typeTxt, { color: colors.textMuted }, adjType === 'INCREASE' && { color: '#10b981', fontWeight: '700' }]}>
                    Increase
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, adjType === 'DECREASE' && styles.typeBtnDec]}
                  onPress={() => setAdjType('DECREASE')}
                >
                  <Feather name="minus-circle" size={16} color={adjType === 'DECREASE' ? '#ef4444' : colors.textMuted} />
                  <Text style={[styles.typeTxt, { color: colors.textMuted }, adjType === 'DECREASE' && { color: '#ef4444', fontWeight: '700' }]}>
                    Decrease
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Quantity *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={adjQty}
                onChangeText={setAdjQty}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reason</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                value={adjReason}
                onChangeText={setAdjReason}
                placeholder="Reason for adjustment"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.quickFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowStockModal(false)}
              >
                <Text style={[styles.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent }, adjSaving && { opacity: 0.7 }]}
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

// ─── Product Detail Component ─────────────────────────────────────────────────
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
  const { colors } = useTheme();
  const [tab, setTab] = useState<'product' | 'design'>('product');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const productImgs: string[] = p.productImages || [];
  const designImgs: string[] = p.designImages || [];
  const activeImages = tab === 'product' ? productImgs : designImgs;
  const currentImg = activeImages[activeIdx];

  const handleTabSwitch = (t: 'product' | 'design') => {
    setTab(t);
    setActiveIdx(0);
  };

  const prevImage = () => {
    if (activeImages.length <= 1) return;
    setActiveIdx(i => (i - 1 + activeImages.length) % activeImages.length);
  };

  const nextImage = () => {
    if (activeImages.length <= 1) return;
    setActiveIdx(i => (i + 1) % activeImages.length);
  };

  const rows = [
    { label: 'Part Number',    value: p.partNumber },
    { label: 'Company',        value: p.company },
    { label: 'Category',       value: p.category?.name },
    { label: 'Supplier',       value: p.supplier?.name },
    { label: 'Location',       value: p.location },
    { label: 'Unit',           value: p.unit },
    { label: 'GST',            value: p.gstPercent ? `${p.gstPercent}%` : null },
    { label: 'Barcode',        value: p.barcode },
    { label: 'Min Stock',      value: p.minStock != null ? String(p.minStock) : null },
    { label: 'Purchase Price', value: p.purchasePrice ? `₹${Number(p.purchasePrice).toLocaleString('en-IN')}` : null },
  ].filter(r => r.value);

  return (
    <SafeAreaView style={[dtStyles.root, { backgroundColor: colors.bgCard }]}>
      {/* Header */}
      <View style={[dtStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[dtStyles.title, { color: colors.textPrimary }]} numberOfLines={2}>{p.name}</Text>
        <View style={dtStyles.headerActions}>
          <TouchableOpacity onPress={onEdit} style={[dtStyles.editBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
            <Feather name="edit-2" size={16} color={colors.accentLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[dtStyles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={dtStyles.body} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery Tab Switcher */}
        <View style={[dtStyles.tabContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[dtStyles.galleryTab, tab === 'product' && [dtStyles.galleryTabActive, { backgroundColor: colors.bgCard, borderColor: colors.border }]]}
            onPress={() => handleTabSwitch('product')}
          >
            <Feather name="camera" size={14} color={tab === 'product' ? colors.accentLight : colors.textMuted} />
            <Text style={[dtStyles.galleryTabTxt, { color: colors.textMuted }, tab === 'product' && { color: colors.accentLight, fontWeight: '700' }]}>
              Product ({productImgs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[dtStyles.galleryTab, tab === 'design' && [dtStyles.galleryTabActive, { backgroundColor: colors.bgCard, borderColor: colors.border }]]}
            onPress={() => handleTabSwitch('design')}
          >
            <Feather name="file-text" size={14} color={tab === 'design' ? colors.purple : colors.textMuted} />
            <Text style={[dtStyles.galleryTabTxt, { color: colors.textMuted }, tab === 'design' && { color: colors.purple, fontWeight: '700' }]}>
              Design / Drawing ({designImgs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Image Preview Box */}
        {currentImg ? (
          <View style={dtStyles.imageContainer}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setLightboxVisible(true)} style={dtStyles.imgWrapper}>
              <Image source={{ uri: currentImg }} style={dtStyles.img} resizeMode="contain" />
              <View style={dtStyles.zoomBadge}>
                <Feather name="zoom-in" size={13} color="#fff" />
                <Text style={dtStyles.zoomBadgeTxt}>Tap to zoom</Text>
              </View>
            </TouchableOpacity>

            {activeImages.length > 1 && (
              <View style={dtStyles.navControls}>
                <TouchableOpacity onPress={prevImage} style={[dtStyles.navBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Feather name="chevron-left" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={dtStyles.pageCounter}>{activeIdx + 1} / {activeImages.length}</Text>
                <TouchableOpacity onPress={nextImage} style={[dtStyles.navBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Feather name="chevron-right" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[dtStyles.imgPlaceholder, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Feather name={tab === 'product' ? 'camera' : 'file-text'} size={40} color={colors.textMuted} />
            <Text style={[dtStyles.noImgTxt, { color: colors.textMuted }]}>
              No {tab === 'product' ? 'product' : 'design'} photos uploaded
            </Text>
          </View>
        )}

        {/* Thumbnail Strip */}
        {activeImages.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dtStyles.thumbStrip}>
            {activeImages.map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveIdx(i)}
                style={[
                  dtStyles.thumbBox,
                  { borderColor: colors.border },
                  i === activeIdx && { borderColor: tab === 'product' ? colors.accent : colors.purple, borderWidth: 2 }
                ]}
              >
                <Image source={{ uri: img }} style={dtStyles.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stock stats row */}
        <View style={dtStyles.statsRow}>
          <TouchableOpacity style={[dtStyles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={onStockAdjust} activeOpacity={0.8}>
            <Text style={[dtStyles.statVal, { color: colors.textPrimary }]}>{p.currentStock ?? 0}</Text>
            <Text style={[dtStyles.statLabel, { color: colors.textMuted }]}>In Stock</Text>
            <View style={[dtStyles.adjustHint, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
              <Feather name="refresh-cw" size={10} color={colors.accentLight} />
              <Text style={[dtStyles.adjustHintTxt, { color: colors.accentLight }]}>Adjust</Text>
            </View>
          </TouchableOpacity>
          <View style={[dtStyles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.statVal, { color: colors.green }]}>
              {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
            </Text>
            <Text style={[dtStyles.statLabel, { color: colors.textMuted }]}>Sale Price</Text>
          </View>
          <View style={[dtStyles.statBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.statVal, { color: colors.purple }]}>
              {p.gstPercent ? `${p.gstPercent}%` : '—'}
            </Text>
            <Text style={[dtStyles.statLabel, { color: colors.textMuted }]}>GST</Text>
          </View>
        </View>

        {/* Field rows */}
        {rows.map(r => (
          <View key={r.label} style={[dtStyles.row, { borderBottomColor: colors.border }]}>
            <Text style={[dtStyles.rowLabel, { color: colors.textSecondary }]}>{r.label}</Text>
            <Text style={[dtStyles.rowValue, { color: colors.textPrimary }]}>{r.value}</Text>
          </View>
        ))}

        {p.specifications ? (
          <View style={[dtStyles.textBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.textBoxTitle, { color: colors.textMuted }]}>Specifications</Text>
            <Text style={[dtStyles.textBoxContent, { color: colors.textSecondary }]}>{p.specifications}</Text>
          </View>
        ) : null}

        {p.description ? (
          <View style={[dtStyles.textBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.textBoxTitle, { color: colors.textMuted }]}>Description</Text>
            <Text style={[dtStyles.textBoxContent, { color: colors.textSecondary }]}>{p.description}</Text>
          </View>
        ) : null}

        {/* Delete button */}
        <TouchableOpacity style={dtStyles.deleteBtn} onPress={onDelete}>
          <Feather name="trash-2" size={16} color={colors.red} />
          <Text style={dtStyles.deleteTxt}>Delete Product</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Lightbox Zoom Modal */}
      <Modal visible={lightboxVisible} transparent animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
        <View style={dtStyles.lightboxOverlay}>
          <SafeAreaView style={dtStyles.lightboxHeader}>
            <TouchableOpacity onPress={() => setLightboxVisible(false)} style={dtStyles.lightboxClose}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={dtStyles.lightboxTitle}>{tab === 'product' ? 'Product Photo' : 'Design Drawing'}</Text>
          </SafeAreaView>
          <View style={dtStyles.lightboxContent}>
            {currentImg && (
              <Image source={{ uri: currentImg }} style={dtStyles.lightboxImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Product Form (Add / Edit with Photo Uploads) ─────────────────────────────
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
  const { colors } = useTheme();
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

  const pickImages = async (type: 'product' | 'design') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1, // Will compress during manipulation
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = await Promise.all(result.assets.map(async (a) => {
          const manipResult = await ImageManipulator.manipulateAsync(
            a.uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          return `data:image/jpeg;base64,${manipResult.base64}`;
        }));
        
        if (type === 'product') {
          setForm((prev: any) => ({ ...prev, productImages: [...(prev.productImages || []), ...uris] }));
        } else {
          setForm((prev: any) => ({ ...prev, designImages: [...(prev.designImages || []), ...uris] }));
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to pick photos.');
    }
  };

  const removeImage = (type: 'product' | 'design', index: number) => {
    if (type === 'product') {
      setForm((prev: any) => ({
        ...prev,
        productImages: prev.productImages.filter((_: any, i: number) => i !== index),
      }));
    } else {
      setForm((prev: any) => ({
        ...prev,
        designImages: prev.designImages.filter((_: any, i: number) => i !== index),
      }));
    }
  };

  return (
    <SafeAreaView style={[fStyles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[fStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={fStyles.closeBtn}>
          <Feather name="x" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[fStyles.title, { color: colors.textPrimary }]}>
          {editProduct ? 'Edit Product' : 'New Product'}
        </Text>
        <TouchableOpacity
          onPress={onSave}
          style={[fStyles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.7 }]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={fStyles.saveTxt}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={fStyles.body} showsVerticalScrollIndicator={false}>
          {/* Section: Photos */}
          <Text style={[fStyles.sectionHeader, { color: colors.textMuted }]}>PHOTOS & DESIGN DRAWINGS</Text>

          {/* Product Photos */}
          <View style={[fStyles.photoSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={fStyles.photoHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="camera" size={16} color={colors.accentLight} />
                <Text style={[fStyles.photoTitle, { color: colors.textPrimary }]}>Product Photos</Text>
                <Text style={[fStyles.photoCount, { color: colors.textMuted }]}>({form.productImages?.length || 0})</Text>
              </View>
              <TouchableOpacity
                style={[fStyles.addPhotoBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
                onPress={() => pickImages('product')}
              >
                <Feather name="plus" size={14} color={colors.accentLight} />
                <Text style={[fStyles.addPhotoTxt, { color: colors.accentLight }]}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            {form.productImages?.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fStyles.photoThumbList}>
                {form.productImages.map((uri, idx) => (
                  <View key={idx} style={[fStyles.formThumbWrapper, { borderColor: colors.border }]}>
                    <Image source={{ uri }} style={fStyles.formThumb} />
                    <TouchableOpacity
                      style={fStyles.removeThumbBtn}
                      onPress={() => removeImage('product', idx)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="x" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[fStyles.emptyPhotoHint, { color: colors.textMuted }]}>No product photos added yet</Text>
            )}
          </View>

          {/* Design Photos */}
          <View style={[fStyles.photoSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={fStyles.photoHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="file-text" size={16} color={colors.purple} />
                <Text style={[fStyles.photoTitle, { color: colors.textPrimary }]}>Design / Drawing Photos</Text>
                <Text style={[fStyles.photoCount, { color: colors.textMuted }]}>({form.designImages?.length || 0})</Text>
              </View>
              <TouchableOpacity
                style={[fStyles.addPhotoBtn, { backgroundColor: 'rgba(139,92,246,0.12)', borderColor: colors.purple }]}
                onPress={() => pickImages('design')}
              >
                <Feather name="plus" size={14} color={colors.purple} />
                <Text style={[fStyles.addPhotoTxt, { color: colors.purple }]}>Add Design</Text>
              </TouchableOpacity>
            </View>

            {form.designImages?.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fStyles.photoThumbList}>
                {form.designImages.map((uri, idx) => (
                  <View key={idx} style={[fStyles.formThumbWrapper, { borderColor: colors.border }]}>
                    <Image source={{ uri }} style={fStyles.formThumb} />
                    <TouchableOpacity
                      style={fStyles.removeThumbBtn}
                      onPress={() => removeImage('design', idx)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="x" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[fStyles.emptyPhotoHint, { color: colors.textMuted }]}>No technical drawings / design photos added</Text>
            )}
          </View>

          {/* Section: Basic info */}
          <Text style={[fStyles.sectionHeader, { color: colors.textMuted }]}>BASIC INFORMATION</Text>

          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Product Name *</Text>
            <TextInput
              style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
              value={form.name}
              onChangeText={v => setForm((f: any) => ({ ...f, name: v }))}
              placeholder="e.g. Hex Nut 10mm"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={fStyles.row2}>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Part Number</Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.partNumber}
                onChangeText={v => setForm((f: any) => ({ ...f, partNumber: v }))}
                placeholder="e.g. PN-1029"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Brand / Company</Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.company}
                onChangeText={v => setForm((f: any) => ({ ...f, company: v }))}
                placeholder="e.g. Ashirwad"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Category Picker */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[fStyles.picker, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => { setCatSearch(''); setShowCatPicker(true); }}
            >
              <Text style={[fStyles.pickerTxt, { color: selectedCat ? colors.textPrimary : colors.textMuted }]}>
                {selectedCat ? selectedCat.name : 'Select Category'}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Supplier Picker */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Supplier</Text>
            <TouchableOpacity
              style={[fStyles.picker, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => { setSupSearch(''); setShowSupPicker(true); }}
            >
              <Text style={[fStyles.pickerTxt, { color: selectedSup ? selectedSup.name : colors.textMuted }]}>
                {selectedSup ? selectedSup.name : 'Select Supplier'}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Location & Unit */}
          <View style={fStyles.row2}>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Shelf / Location</Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.location}
                onChangeText={v => setForm((f: any) => ({ ...f, location: v }))}
                placeholder="e.g. Rack A-3"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Unit</Text>
              <TouchableOpacity
                style={[fStyles.picker, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => setShowUnitPicker(true)}
              >
                <Text style={[fStyles.pickerTxt, { color: colors.textPrimary }]}>{form.unit}</Text>
                <Feather name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing & Tax */}
          <Text style={[fStyles.sectionHeader, { color: colors.textMuted }]}>PRICING & TAX</Text>

          <View style={fStyles.row2}>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Sale Price (₹)</Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.price}
                onChangeText={v => setForm((f: any) => ({ ...f, price: v }))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Purchase Price (₹)</Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.purchasePrice}
                onChangeText={v => setForm((f: any) => ({ ...f, purchasePrice: v }))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* GST */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>GST Rate (%)</Text>
            <View style={fStyles.gstRow}>
              {GST_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    fStyles.gstChip,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    form.gstPercent === g && [fStyles.gstChipActive, { borderColor: colors.accent, backgroundColor: colors.accentGlow }]
                  ]}
                  onPress={() => setForm((f: any) => ({ ...f, gstPercent: g }))}
                >
                  <Text style={[fStyles.gstChipTxt, { color: colors.textSecondary }, form.gstPercent === g && { color: colors.accentLight, fontWeight: '700' }]}>
                    {g}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stock */}
          <Text style={[fStyles.sectionHeader, { color: colors.textMuted }]}>INVENTORY</Text>

          <View style={fStyles.row2}>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>
                {editProduct ? 'Current Stock' : 'Opening Stock'}
              </Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.currentStock}
                onChangeText={v => setForm((f: any) => ({ ...f, currentStock: v }))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
            <View style={[fStyles.fieldGroup, { flex: 1 }]}>
              <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Min Stock Alert</Text>
              <TextInput
                style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                value={form.minStock}
                onChangeText={v => setForm((f: any) => ({ ...f, minStock: v }))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Barcode */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Barcode</Text>
            <TextInput
              style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
              value={form.barcode}
              onChangeText={v => setForm((f: any) => ({ ...f, barcode: v }))}
              placeholder="Barcode / UPC / EAN"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Specifications */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Specifications</Text>
            <TextInput
              style={[fStyles.input, fStyles.textarea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
              value={form.specifications}
              onChangeText={v => setForm((f: any) => ({ ...f, specifications: v }))}
              placeholder="Technical specs, material, dimensions..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Description */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[fStyles.input, fStyles.textarea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
              value={form.description}
              onChangeText={v => setForm((f: any) => ({ ...f, description: v }))}
              placeholder="Product notes, remarks..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <Modal visible={showCatPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={[fStyles.pickerSheet, { backgroundColor: colors.bgCard }]}>
            <View style={[fStyles.pickerModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[fStyles.pickerModalTitle, { color: colors.textPrimary }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCatPicker(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[fStyles.searchRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.textMuted} />
              <TextInput
                style={[fStyles.searchInput, { color: colors.textPrimary }]}
                value={catSearch}
                onChangeText={setCatSearch}
                placeholder="Search categories..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[fStyles.pickerItem, { borderBottomColor: colors.border }, !form.categoryId && [fStyles.pickerItemActive, { backgroundColor: colors.accentGlow }]]}
                onPress={() => { setForm((f: any) => ({ ...f, categoryId: '' })); setShowCatPicker(false); }}
              >
                <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }]}>None</Text>
              </TouchableOpacity>
              {filteredCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[fStyles.pickerItem, { borderBottomColor: colors.border }, form.categoryId === c.id && [fStyles.pickerItemActive, { backgroundColor: colors.accentGlow }]]}
                  onPress={() => { setForm((f: any) => ({ ...f, categoryId: c.id })); setShowCatPicker(false); }}
                >
                  <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }, form.categoryId === c.id && { color: colors.accentLight, fontWeight: '700' }]}>
                    {c.name}
                  </Text>
                  {form.categoryId === c.id && <Feather name="check" size={16} color={colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supplier Picker Modal */}
      <Modal visible={showSupPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={[fStyles.pickerSheet, { backgroundColor: colors.bgCard }]}>
            <View style={[fStyles.pickerModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[fStyles.pickerModalTitle, { color: colors.textPrimary }]}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupPicker(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[fStyles.searchRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.textMuted} />
              <TextInput
                style={[fStyles.searchInput, { color: colors.textPrimary }]}
                value={supSearch}
                onChangeText={setCatSearch}
                placeholder="Search suppliers..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[fStyles.pickerItem, { borderBottomColor: colors.border }, !form.supplierId && [fStyles.pickerItemActive, { backgroundColor: colors.accentGlow }]]}
                onPress={() => { setForm((f: any) => ({ ...f, supplierId: '' })); setShowSupPicker(false); }}
              >
                <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }]}>None</Text>
              </TouchableOpacity>
              {filteredSups.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[fStyles.pickerItem, { borderBottomColor: colors.border }, form.supplierId === s.id && [fStyles.pickerItemActive, { backgroundColor: colors.accentGlow }]]}
                  onPress={() => { setForm((f: any) => ({ ...f, supplierId: s.id })); setShowSupPicker(false); }}
                >
                  <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }, form.supplierId === s.id && { color: colors.accentLight, fontWeight: '700' }]}>
                    {s.name}
                  </Text>
                  {form.supplierId === s.id && <Feather name="check" size={16} color={colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unit Picker Modal */}
      <Modal visible={showUnitPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={[fStyles.pickerSheet, { backgroundColor: colors.bgCard }]}>
            <View style={[fStyles.pickerModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[fStyles.pickerModalTitle, { color: colors.textPrimary }]}>Select Unit</Text>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {UNIT_OPTIONS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[fStyles.pickerItem, { borderBottomColor: colors.border }, form.unit === u && [fStyles.pickerItemActive, { backgroundColor: colors.accentGlow }]]}
                  onPress={() => { setForm((f: any) => ({ ...f, unit: u })); setShowUnitPicker(false); }}
                >
                  <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }, form.unit === u && { color: colors.accentLight, fontWeight: '700' }]}>
                    {u}
                  </Text>
                  {form.unit === u && <Feather name="check" size={16} color={colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  count: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  thumbWrapper: { position: 'relative' },
  thumb: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.bgSecondary },
  thumbPlaceholder: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  imgBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1,
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  imgBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
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
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
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

  // Gallery tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  galleryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  galleryTabActive: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  galleryTabTxt: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },

  // Image display
  imageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bgSecondary,
  },
  imgWrapper: {
    width: '100%',
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  zoomBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },
  navControls: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    pointerEvents: 'box-none',
  },
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  pageCounter: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 11, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  imgPlaceholder: {
    width: '100%', height: 160,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    gap: 6,
  },
  noImgTxt: { fontSize: 12, color: Colors.textMuted },
  thumbStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
    paddingVertical: 2,
  },
  thumbBox: {
    width: 54, height: 54,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbImg: { width: '100%', height: '100%' },

  // Stats & rows
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

  // Lightbox
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  lightboxClose: { padding: 4 },
  lightboxTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lightboxContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  lightboxImage: {
    width: '100%',
    height: '85%',
  },
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

  // Photo Section
  photoSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  photoCount: { fontSize: 12, color: Colors.textMuted },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  addPhotoTxt: { fontSize: 12, fontWeight: '700' },
  photoThumbList: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  formThumbWrapper: {
    width: 68, height: 68,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formThumb: { width: '100%', height: '100%' },
  removeThumbBtn: {
    position: 'absolute',
    top: 3, right: 3,
    backgroundColor: 'rgba(239,68,68,0.85)',
    width: 18, height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoHint: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

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
