import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Modal, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import SearchBar from '../../components/SearchBar';
import ListItem from '../../components/ListItem';
import { Colors, Spacing, Radius } from '../../constants/Colors';

export default function SalesScreen() {
  const [sales, setSales]         = useState<any[]>([]);
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
      const { data } = await api.get('/sales', {
        params: { search: q, page: p, limit: 20 },
      });
      const items = data.sales ?? data;
      if (p === 1) setSales(Array.isArray(items) ? items : []);
      else setSales(prev => [...prev, ...(Array.isArray(items) ? items : [])]);
      setTotal(data.total ?? items.length ?? 0);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { load(1, search); }, [search]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtCur = (n: number) =>
    '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <Text style={styles.count}>{total} orders</Text>
      </View>

      <FlatList
        data={sales}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <SearchBar
            value={search}
            onChangeText={v => { setSearch(v); setPage(1); }}
            placeholder="Search customer, invoice..."
          />
        }
        renderItem={({ item }) => (
          <ListItem
            title={item.customer?.name ?? item.customerName ?? `Order #${item.id}`}
            subtitle={`${fmtDate(item.saleDate ?? item.createdAt)}  ·  ${item.sale_items?.length ?? 0} items`}
            rightLabel={fmtCur(item.totalAmount ?? item.grandTotal ?? 0)}
            badgeColor={Colors.green}
            badgeBg="rgba(16,185,129,0.12)"
            onPress={() => setSelected(item)}
            iconPlaceholder={<Feather name="trending-up" size={20} color={Colors.green} />}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(1, search, true)} tintColor={Colors.accent} />
        }
        onEndReached={() => {
          if (sales.length < total && !loadingMore) load(page + 1, search);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.accent} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="trending-up" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No sales orders found</Text>
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

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && <SaleDetail sale={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

function SaleDetail({ sale, onClose }: { sale: any; onClose: () => void }) {
  const fmtCur = (n: number) =>
    '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const items: any[] = sale.sale_items ?? [];

  return (
    <SafeAreaView style={dtStyles.root}>
      <View style={dtStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={dtStyles.orderId}>Order #{sale.id}</Text>
          <Text style={dtStyles.customer}>{sale.customer?.name ?? sale.customerName ?? '—'}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={dtStyles.closeBtn}>
          <Feather name="x" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={dtStyles.body}>
        {/* Summary row */}
        <View style={dtStyles.summaryRow}>
          <View style={dtStyles.summaryBox}>
            <Text style={[dtStyles.summaryVal, { color: Colors.green }]}>
              {fmtCur(sale.totalAmount ?? sale.grandTotal ?? 0)}
            </Text>
            <Text style={dtStyles.summaryLabel}>Grand Total</Text>
          </View>
          <View style={dtStyles.summaryBox}>
            <Text style={dtStyles.summaryVal}>{fmtDate(sale.saleDate ?? sale.createdAt)}</Text>
            <Text style={dtStyles.summaryLabel}>Date</Text>
          </View>
          <View style={dtStyles.summaryBox}>
            <Text style={[dtStyles.summaryVal, { color: Colors.yellow }]}>
              {fmtCur(sale.taxAmount ?? 0)}
            </Text>
            <Text style={dtStyles.summaryLabel}>Tax (GST)</Text>
          </View>
        </View>

        {/* Meta rows */}
        {sale.invoiceNumber && (
          <View style={dtStyles.row}>
            <Text style={dtStyles.rowLabel}>Invoice No.</Text>
            <Text style={dtStyles.rowValue}>{sale.invoiceNumber}</Text>
          </View>
        )}
        {sale.notes && (
          <View style={dtStyles.row}>
            <Text style={dtStyles.rowLabel}>Notes</Text>
            <Text style={dtStyles.rowValue}>{sale.notes}</Text>
          </View>
        )}

        {/* Items */}
        {items.length > 0 && (
          <>
            <Text style={dtStyles.sectionTitle}>{items.length} Item{items.length !== 1 ? 's' : ''}</Text>
            {items.map((it, i) => (
              <View key={i} style={dtStyles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={dtStyles.lineItemName}>{it.product?.name ?? `Item ${i + 1}`}</Text>
                  <Text style={dtStyles.lineItemSub}>
                    Qty: {it.quantity} × {fmtCur(it.unitPrice ?? it.rate ?? 0)}
                  </Text>
                </View>
                <Text style={dtStyles.lineItemTotal}>
                  {fmtCur((it.quantity ?? 0) * (it.unitPrice ?? it.rate ?? 0))}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  count: { fontSize: 12, color: Colors.textMuted },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center',
    justifyContent: 'center', backgroundColor: Colors.bgPrimary,
  },
});

const dtStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgCard },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  orderId: { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  customer: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: Spacing.xl, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  summaryBox: {
    flex: 1, backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: 13, color: Colors.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  lineItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  lineItemName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  lineItemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  lineItemTotal: { fontSize: 14, fontWeight: '700', color: Colors.green },
});
