import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Modal, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import SearchBar from '../../components/SearchBar';
import { Colors, Spacing, Radius } from '../../constants/Colors';

export default function SalesScreen() {
  const { colors } = useTheme();
  const [sales, setSales]             = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected]       = useState<any>(null);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search]);

  useEffect(() => { load(1, search); }, [search]);

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const fmtCur = (n?: number | string) =>
    '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Sales Orders</Text>
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {total.toLocaleString('en-IN')} orders registered
          </Text>
        </View>
        <View style={[styles.badgePill, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
          <Feather name="trending-up" size={13} color={colors.accentLight} />
          <Text style={[styles.badgePillTxt, { color: colors.accentLight }]}>Live</Text>
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.sm }}>
            <SearchBar
              value={search}
              onChangeText={v => { setSearch(v); setPage(1); }}
              placeholder="Search customer, invoice, order ID..."
            />
          </View>
        }
        renderItem={({ item }) => {
          const itemCount = item.sale_items?.length ?? 0;
          const totalAmt = item.totalAmount ?? item.grandTotal ?? 0;

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconCapsule, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Feather name="arrow-up-right" size={18} color="#10b981" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.customerName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.customer?.name ?? item.customerName ?? `Order #${String(item.id).slice(-6)}`}
                    </Text>
                    <Text style={[styles.totalAmount, { color: colors.green }]}>
                      {fmtCur(totalAmt)}
                    </Text>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaBadge}>
                      <Text style={[styles.orderNum, { color: colors.textMuted }]}>
                        {item.invoiceNumber ? `INV: ${item.invoiceNumber}` : `ORD #${String(item.id).slice(-6)}`}
                      </Text>
                    </View>
                    <Text style={[styles.dot, { color: colors.textMuted }]}>·</Text>
                    <Text style={[styles.metaTxt, { color: colors.textSecondary }]}>
                      {fmtDate(item.saleDate ?? item.createdAt)}
                    </Text>
                    <Text style={[styles.dot, { color: colors.textMuted }]}>·</Text>
                    <View style={[styles.itemPill, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.itemPillTxt, { color: colors.textMuted }]}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
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
          if (sales.length < total && !loadingMore) load(page + 1, search);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.bgSecondary }]}>
                <Feather name="trending-up" size={36} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sales orders found</Text>
              <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                Try adjusting your search criteria
              </Text>
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

      {/* Sale Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && <SaleDetail sale={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sale Detail Modal ────────────────────────────────────────────────────────
function SaleDetail({ sale, onClose }: { sale: any; onClose: () => void }) {
  const { colors } = useTheme();
  const fmtCur = (n: number) =>
    '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const items: any[] = sale.sale_items ?? [];

  return (
    <SafeAreaView style={[dtStyles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[dtStyles.header, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={[dtStyles.orderId, { color: colors.textMuted }]}>
              {sale.invoiceNumber ? `Invoice ${sale.invoiceNumber}` : `Order #${String(sale.id).slice(-6)}`}
            </Text>
            <View style={[dtStyles.paidBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Text style={[dtStyles.paidBadgeTxt, { color: '#10b981' }]}>Completed</Text>
            </View>
          </View>
          <Text style={[dtStyles.customer, { color: colors.textPrimary }]} numberOfLines={1}>
            {sale.customer?.name ?? sale.customerName ?? '—'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={[dtStyles.closeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Feather name="x" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={dtStyles.body} showsVerticalScrollIndicator={false}>
        {/* Financial Highlights */}
        <View style={dtStyles.summaryRow}>
          <View style={[dtStyles.summaryBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[dtStyles.summaryVal, { color: colors.green }]}>
              {fmtCur(sale.totalAmount ?? sale.grandTotal ?? 0)}
            </Text>
            <Text style={[dtStyles.summaryLabel, { color: colors.textMuted }]}>Grand Total</Text>
          </View>

          <View style={[dtStyles.summaryBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[dtStyles.summaryVal, { color: colors.textPrimary }]}>
              {fmtDate(sale.saleDate ?? sale.createdAt)}
            </Text>
            <Text style={[dtStyles.summaryLabel, { color: colors.textMuted }]}>Order Date</Text>
          </View>

          <View style={[dtStyles.summaryBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[dtStyles.summaryVal, { color: colors.yellow }]}>
              {fmtCur(sale.taxAmount ?? 0)}
            </Text>
            <Text style={[dtStyles.summaryLabel, { color: colors.textMuted }]}>GST Tax</Text>
          </View>
        </View>

        {/* Customer & Order Metadata */}
        <View style={[dtStyles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[dtStyles.cardHeading, { color: colors.textMuted }]}>ORDER INFORMATION</Text>

          {sale.customer?.phone && (
            <View style={dtStyles.row}>
              <Text style={[dtStyles.rowLabel, { color: colors.textSecondary }]}>Customer Phone</Text>
              <Text style={[dtStyles.rowValue, { color: colors.textPrimary }]}>{sale.customer.phone}</Text>
            </View>
          )}

          {sale.customer?.gstin && (
            <View style={dtStyles.row}>
              <Text style={[dtStyles.rowLabel, { color: colors.textSecondary }]}>Customer GSTIN</Text>
              <Text style={[dtStyles.rowValue, { color: colors.textPrimary }]}>{sale.customer.gstin}</Text>
            </View>
          )}

          {sale.invoiceNumber && (
            <View style={dtStyles.row}>
              <Text style={[dtStyles.rowLabel, { color: colors.textSecondary }]}>Invoice Number</Text>
              <Text style={[dtStyles.rowValue, { color: colors.accentLight, fontWeight: '700' }]}>{sale.invoiceNumber}</Text>
            </View>
          )}

          {sale.notes && (
            <View style={[dtStyles.row, { borderBottomWidth: 0 }]}>
              <Text style={[dtStyles.rowLabel, { color: colors.textSecondary }]}>Notes</Text>
              <Text style={[dtStyles.rowValue, { color: colors.textPrimary }]}>{sale.notes}</Text>
            </View>
          )}
        </View>

        {/* Line Items */}
        {items.length > 0 && (
          <>
            <Text style={[dtStyles.sectionTitle, { color: colors.textMuted }]}>
              Purchased Items ({items.length})
            </Text>
            {items.map((it, i) => (
              <View key={i} style={[dtStyles.lineItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={dtStyles.itemLeft}>
                  <View style={[dtStyles.itemIndexCircle, { backgroundColor: colors.bgSecondary }]}>
                    <Text style={[dtStyles.itemIndexText, { color: colors.textMuted }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[dtStyles.lineItemName, { color: colors.textPrimary }]}>
                      {it.product?.name ?? `Item ${i + 1}`}
                    </Text>
                    <Text style={[dtStyles.lineItemSub, { color: colors.textSecondary }]}>
                      {it.quantity} {it.product?.unit || 'pcs'} × {fmtCur(it.unitPrice ?? it.rate ?? 0)}
                    </Text>
                  </View>
                </View>
                <Text style={[dtStyles.lineItemTotal, { color: colors.green }]}>
                  {fmtCur((it.quantity ?? 0) * (it.unitPrice ?? it.rate ?? 0))}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  count: { fontSize: 12, marginTop: 2 },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  badgePillTxt: { fontSize: 11, fontWeight: '700' },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCapsule: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  totalAmount: { fontSize: 15, fontWeight: '800' },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  metaBadge: {},
  orderNum: { fontSize: 11, fontWeight: '600' },
  dot: { fontSize: 12 },
  metaTxt: { fontSize: 11, fontWeight: '500' },
  itemPill: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm, borderWidth: 1,
  },
  itemPillTxt: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySubText: { fontSize: 13 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
});

const dtStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, gap: 12,
  },
  orderId: { fontSize: 12, fontWeight: '600' },
  paidBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  paidBadgeTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  customer: { fontSize: 18, fontWeight: '800' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  body: { padding: Spacing.lg, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  summaryBox: {
    flex: 1,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1,
  },
  summaryVal: { fontSize: 15, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  infoCard: {
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, marginBottom: Spacing.lg,
  },
  cardHeading: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: { fontSize: 12 },
  rowValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: Spacing.xs, marginBottom: Spacing.sm, paddingLeft: 2,
  },
  lineItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 8,
    borderWidth: 1,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemIndexCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  itemIndexText: { fontSize: 11, fontWeight: '700' },
  lineItemName: { fontSize: 13, fontWeight: '700' },
  lineItemSub: { fontSize: 11, marginTop: 2 },
  lineItemTotal: { fontSize: 14, fontWeight: '800' },
});
