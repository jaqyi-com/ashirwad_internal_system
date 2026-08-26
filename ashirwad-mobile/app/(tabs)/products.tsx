import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, TouchableOpacity,
  Modal, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import SearchBar from '../../components/SearchBar';
import ListItem from '../../components/ListItem';
import { Colors, Spacing, Radius } from '../../constants/Colors';

export default function ProductsScreen() {
  const [products, setProducts]   = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected]   = useState<any>(null);

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

  useEffect(() => { load(1, search); }, [search]);

  const stockBadge = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: Colors.red, bg: 'rgba(239,68,68,0.12)' };
    if (qty < 10) return { label: `${qty} low`, color: Colors.yellow, bg: 'rgba(245,158,11,0.12)' };
    return { label: `${qty} units`, color: Colors.green, bg: 'rgba(16,185,129,0.12)' };
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.count}>{total.toLocaleString('en-IN')} items</Text>
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
          return (
            <ListItem
              title={item.name}
              subtitle={item.partNumber ? `Part: ${item.partNumber}` : item.category?.name ?? ''}
              badge={s.label}
              badgeColor={s.color}
              badgeBg={s.bg}
              imageUri={item.productImages?.[0]}
              onPress={() => setSelected(item)}
            />
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
        {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

function ProductDetail({ product: p, onClose }: { product: any; onClose: () => void }) {
  const imgs = [...(p.productImages ?? []), ...(p.designImages ?? [])];
  const rows = [
    { label: 'Part Number', value: p.partNumber },
    { label: 'Category',    value: p.category?.name },
    { label: 'Supplier',    value: p.supplier?.name },
    { label: 'Location',    value: p.location },
    { label: 'Unit',        value: p.unit },
    { label: 'GST',         value: p.gstPercent ? `${p.gstPercent}%` : null },
    { label: 'HSN Code',    value: p.hsnCode },
    { label: 'Barcode',     value: p.barcode },
    { label: 'Sale Price',  value: p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : null },
    { label: 'Buy Price',   value: p.purchasePrice ? `₹${Number(p.purchasePrice).toLocaleString('en-IN')}` : null },
  ].filter(r => r.value);

  return (
    <SafeAreaView style={dtStyles.root}>
      <View style={dtStyles.header}>
        <Text style={dtStyles.title} numberOfLines={2}>{p.name}</Text>
        <TouchableOpacity onPress={onClose} style={dtStyles.closeBtn}>
          <Feather name="x" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
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

        {/* Stock */}
        <View style={dtStyles.stockRow}>
          <View style={dtStyles.stockBox}>
            <Text style={dtStyles.stockVal}>{p.currentStock ?? 0}</Text>
            <Text style={dtStyles.stockLabel}>In Stock</Text>
          </View>
          <View style={dtStyles.stockBox}>
            <Text style={[dtStyles.stockVal, { color: Colors.green }]}>
              {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
            </Text>
            <Text style={dtStyles.stockLabel}>Sale Price</Text>
          </View>
          <View style={dtStyles.stockBox}>
            <Text style={[dtStyles.stockVal, { color: Colors.purple }]}>
              {p.gstPercent ? `${p.gstPercent}%` : '—'}
            </Text>
            <Text style={dtStyles.stockLabel}>GST</Text>
          </View>
        </View>

        {/* Details */}
        {rows.map(r => (
          <View key={r.label} style={dtStyles.row}>
            <Text style={dtStyles.rowLabel}>{r.label}</Text>
            <Text style={dtStyles.rowValue}>{r.value}</Text>
          </View>
        ))}

        {p.description ? (
          <View style={dtStyles.descBox}>
            <Text style={dtStyles.descTitle}>Description</Text>
            <Text style={dtStyles.descText}>{p.description}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  count: { fontSize: 12, color: Colors.textMuted },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
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
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
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
  },
  stockRow: {
    flexDirection: 'row', gap: 10,
    marginBottom: Spacing.lg,
  },
  stockBox: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  stockVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  stockLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
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
  descBox: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  descTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  descText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
