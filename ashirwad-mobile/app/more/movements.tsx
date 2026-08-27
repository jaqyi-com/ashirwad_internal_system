import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Transaction {
  id: string;
  transactionType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  notes?: string;
  createdAt: string;
  product: {
    name: string;
    sku?: string;
  };
  createdBy?: {
    name: string;
  };
}

export default function StockMovementsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const typeParam = filterType ? `&type=${filterType}` : '';
      const { data } = await api.get(`/inventory/transactions?limit=100${typeParam}`);
      // The API returns { transactions: [...] }
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Fetch movements failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    const isIn = type.includes('IN') || type === 'PURCHASE';
    return (
      <View style={[
        styles.typeBadge,
        isIn ? styles.badgeIn : styles.badgeOut
      ]}>
        <Text style={[
          styles.badgeText,
          isIn ? styles.badgeTextIn : styles.badgeTextOut
        ]}>
          {type.replace('_', ' ')}
        </Text>
      </View>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filters = [
    { label: 'All', value: null },
    { label: 'Purchases', value: 'PURCHASE' },
    { label: 'Sales', value: 'SALE' },
    { label: 'Adjust In', value: 'ADJUSTMENT_IN' },
    { label: 'Adjust Out', value: 'ADJUSTMENT_OUT' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Movements</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Row */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.label}
              style={[
                styles.filterChip,
                filterType === f.value && styles.filterChipActive
              ]}
              onPress={() => setFilterType(f.value)}
            >
              <Text style={[
                styles.filterChipText,
                filterType === f.value && styles.filterChipTextActive
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noDataText}>No stock movements found</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{item.product?.name}</Text>
                  {item.product?.sku ? (
                    <Text style={styles.prodSku}>SKU: {item.product.sku}</Text>
                  ) : null}
                </View>
                {getTransactionBadge(item.transactionType)}
              </View>

              <View style={styles.stockFlow}>
                <View style={styles.stockBox}>
                  <Text style={styles.stockLabel}>Previous</Text>
                  <Text style={styles.stockNum}>{item.previousStock}</Text>
                </View>
                <Feather name="arrow-right" size={14} color={Colors.textMuted} />
                <View style={styles.stockBox}>
                  <Text style={styles.stockLabel}>Change</Text>
                  <Text style={[
                    styles.stockNum,
                    { fontWeight: '800' },
                    item.transactionType.includes('IN') || item.transactionType === 'PURCHASE' 
                      ? { color: '#10b981' } 
                      : { color: '#ef4444' }
                  ]}>
                    {item.transactionType.includes('IN') || item.transactionType === 'PURCHASE' ? '+' : '-'}{item.quantity}
                  </Text>
                </View>
                <Feather name="arrow-right" size={14} color={Colors.textMuted} />
                <View style={styles.stockBox}>
                  <Text style={styles.stockLabel}>New Stock</Text>
                  <Text style={[styles.stockNum, { color: Colors.accentLight }]}>{item.newStock}</Text>
                </View>
              </View>

              {item.notes ? (
                <View style={styles.notesRow}>
                  <Text style={styles.notesText}>
                    <Text style={{ fontWeight: '700' }}>Reference:</Text> {item.notes}
                  </Text>
                </View>
              ) : null}

              <View style={styles.footer}>
                <Text style={styles.footerMeta}>
                  By {item.createdBy?.name || 'System'} · {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { color: Colors.textMuted, fontSize: 14 },
  filterRow: { gap: 8, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  filterChip: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.accent,
  },
  filterChipText: { fontSize: 12, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.accentLight, fontWeight: '700' },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  prodName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  prodSku: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  typeBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeIn: { backgroundColor: 'rgba(16,185,129,0.12)' },
  badgeOut: { backgroundColor: 'rgba(239,110,110,0.12)' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  badgeTextIn: { color: '#10b981' },
  badgeTextOut: { color: '#ef4444' },
  stockFlow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgSecondary, borderRadius: Radius.md,
    padding: 10, marginVertical: Spacing.md,
  },
  stockBox: { alignItems: 'center', flex: 1 },
  stockLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  stockNum: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  notesRow: { marginBottom: Spacing.sm },
  notesText: { fontSize: 12, color: Colors.textSecondary },
  footer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  footerMeta: { fontSize: 11, color: Colors.textMuted },
});
