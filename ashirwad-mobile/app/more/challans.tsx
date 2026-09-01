import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Modal, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import SearchBar from '../../components/SearchBar';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

export default function ChallansScreen() {
  const [challans, setChallans] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const { colors } = useTheme();

  const load = useCallback(async (p = 1, q = search, isRefresh = false) => {
    if (p === 1) isRefresh ? setRefreshing(true) : setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await api.get('/sales', {
        params: { search: q, page: p, limit: 20, type: 'CHALLAN' },
      });
      const items = data.sales ?? data;
      if (p === 1) setChallans(Array.isArray(items) ? items : []);
      else setChallans(prev => [...prev, ...(Array.isArray(items) ? items : [])]);
      setTotal(data.total ?? items.length ?? 0);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(1, search); }, [search]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtCur = (n: number) =>
    '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Delivery Challans</Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>{total} records</Text>
        </View>
      </View>

      <FlatList
        data={challans}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <SearchBar
            value={search}
            onChangeText={v => { setSearch(v); setPage(1); }}
            placeholder="Search challans by ID or customer..."
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, search, true)} tintColor={colors.textPrimary} />}
        onEndReached={() => { if (!loadingMore && challans.length < total) load(page + 1, search); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 20 }} color={Colors.accent} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="file-text" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No challans found</Text>
            </View>
          ) : <ActivityIndicator style={{ marginTop: 40 }} color={Colors.accent} size="large" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => setSelected(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.customer?.name || 'Unknown Customer'}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'CONFIRMED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                <Text style={[styles.badgeText, { color: item.status === 'CONFIRMED' ? '#10b981' : '#ef4444' }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>ID: {item.id}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{fmtDate(item.createdAt)}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardTotal, { color: colors.textPrimary }]}>{fmtCur(item.totalAmount)}</Text>
              <Text style={[styles.cardItems, { color: colors.textMuted }]}>{item.items?.length || 0} items</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Challan Details</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {selected && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={[styles.infoBlock, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Customer</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{selected.customer?.name}</Text>
                {selected.customer?.address && (
                  <Text style={[styles.infoSub, { color: colors.textMuted }]}>{selected.customer.address}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoBlock, { backgroundColor: colors.bgSecondary, flex: 1 }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{fmtDate(selected.createdAt)}</Text>
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.infoBlock, { backgroundColor: colors.bgSecondary, flex: 1 }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
                  <Text style={[styles.infoValue, { color: selected.status === 'CONFIRMED' ? '#10b981' : '#ef4444' }]}>{selected.status}</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
              <View style={[styles.itemsContainer, { borderColor: colors.border }]}>
                {selected.items?.map((it: any, idx: number) => (
                  <View key={idx} style={[styles.itemRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]}>{it.product?.name}</Text>
                      <Text style={[styles.itemSub, { color: colors.textMuted }]}>{it.quantity} x {fmtCur(it.price)}</Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: colors.textPrimary }]}>{fmtCur(it.total)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{fmtCur(selected.subtotal)}</Text>
                </View>
                {selected.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Discount</Text>
                    <Text style={[styles.summaryVal, { color: '#ef4444' }]}>-{fmtCur(selected.discount)}</Text>
                  </View>
                )}
                {selected.tax > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax (GST)</Text>
                    <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{fmtCur(selected.tax)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.summaryTotalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
                  <Text style={[styles.summaryTotalVal, { color: Colors.accent }]}>{fmtCur(selected.totalAmount)}</Text>
                </View>
              </View>

              {selected.notes && (
                <View style={[styles.infoBlock, { backgroundColor: colors.bgSecondary, marginTop: Spacing.lg }]}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Notes</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary, fontSize: 14, fontWeight: '400' }]}>{selected.notes}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  count: { fontSize: 13, marginTop: 2 },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: '600' },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardSub: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)' },
  cardTotal: { fontSize: 16, fontWeight: '800' },
  cardItems: { fontSize: 12 },

  // Modal
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalContent: { padding: Spacing.lg, paddingBottom: 60 },
  infoBlock: { padding: 16, borderRadius: Radius.md, marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  infoLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '700' },
  infoSub: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: Spacing.sm },
  itemsContainer: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.xl },
  itemRow: { flexDirection: 'row', padding: 16, justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  itemSub: { fontSize: 12 },
  itemTotal: { fontSize: 15, fontWeight: '800' },
  summaryContainer: { gap: 8, paddingHorizontal: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14 },
  summaryVal: { fontSize: 14, fontWeight: '600' },
  summaryTotalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1 },
  summaryTotalLabel: { fontSize: 16, fontWeight: '800' },
  summaryTotalVal: { fontSize: 18, fontWeight: '800' },
});
