import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Stats {
  totalProducts: number;
  totalStock: number;
  inventoryValue: number;
  lowStock: number;
  outOfStock: number;
  pendingOrders: number;
  todaySales: { amount: number; count: number };
  todayPurchases: { amount: number; count: number };
}

interface WeeklyData {
  date: string;
  sales: number;
  purchases: number;
}

interface TopProduct {
  id: string;
  name: string;
  currentStock: number;
  price: number;
  category?: {
    name: string;
  };
}

export default function ReportsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]); 
  const { colors } = useTheme();
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data.stats);
      setWeeklyData(data.weeklyData || []);
      setTopProducts(data.topProducts || []);
    } catch (err) {
      console.error('Fetch reports failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Find max value in weeklyData to scale the custom bars
  const maxWeeklyAmount = Math.max(
    ...weeklyData.map(d => Math.max(d.sales, d.purchases, 100))
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Main Stock Valuation */}
          <View style={styles.valCard}>
            <Text style={styles.valLabel}>Total Stock Valuation</Text>
            <Text style={styles.valAmount}>{formatCurrency(stats?.inventoryValue || 0)}</Text>
            <View style={styles.valMeta}>
              <Feather name="trending-up" size={14} color="#10b981" />
              <Text style={styles.valMetaText}>Asset value calculated from purchase cost</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.grid}>
            <View style={styles.gridCard}>
              <Text style={styles.gridNum}>{stats?.totalProducts}</Text>
              <Text style={styles.gridLabel}>Catalog Items</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridNum}>{stats?.totalStock}</Text>
              <Text style={styles.gridLabel}>Total Items In-Stock</Text>
            </View>
            <View style={[styles.gridCard, { borderColor: '#ef4444' }]}>
              <Text style={[styles.gridNum, { color: '#ef4444' }]}>{stats?.outOfStock}</Text>
              <Text style={styles.gridLabel}>Out of Stock</Text>
            </View>
            <View style={[styles.gridCard, { borderColor: '#eab308' }]}>
              <Text style={[styles.gridNum, { color: '#eab308' }]}>{stats?.pendingOrders}</Text>
              <Text style={styles.gridLabel}>Pending Purchase Orders</Text>
            </View>
          </View>

          {/* Custom Proportional Weekly Bar Chart */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>7-Day Sales vs Purchases</Text>
            <View style={styles.chartContainer}>
              <View style={styles.barArea}>
                {weeklyData.map((day, idx) => {
                  const saleHeight = (day.sales / maxWeeklyAmount) * 120;
                  const purHeight = (day.purchases / maxWeeklyAmount) * 120;

                  return (
                    <View key={day.date} style={styles.chartCol}>
                      <View style={styles.barPair}>
                        {/* Purchase bar */}
                        <View style={[styles.bar, styles.barPur, { height: Math.max(purHeight, 4) }]} />
                        {/* Sale bar */}
                        <View style={[styles.bar, styles.barSale, { height: Math.max(saleHeight, 4) }]} />
                      </View>
                      <Text style={styles.colLabel}>{day.date}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Purchases</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Sales Invoices</Text>
              </View>
            </View>
          </View>

          {/* Top Products by stock */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Highest Stock Reserves</Text>
            <View style={styles.prodList}>
              {topProducts.map((p, idx) => (
                <View key={p.id} style={styles.prodRow}>
                  <Text style={styles.prodRank}>#{idx + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{p.name}</Text>
                    <Text style={styles.prodCat}>{p.category?.name || 'Uncategorized'}</Text>
                  </View>
                  <View style={styles.prodRight}>
                    <Text style={styles.prodStock}>{p.currentStock} units</Text>
                    <Text style={styles.prodPrice}>{formatCurrency(p.price)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
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
  container: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  
  // Stock Valuation Card
  valCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  valLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  valAmount: { fontSize: 26, fontWeight: '900', color: Colors.accentLight, marginTop: 6 },
  valMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  valMetaText: { fontSize: 11, color: Colors.textSecondary },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.lg,
  },
  gridNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  gridLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  // Sections
  sectionCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.lg,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.lg },

  // Custom Chart
  chartContainer: { height: 160, justifyContent: 'flex-end', paddingTop: 10 },
  barArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6 },
  chartCol: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 120, justifyContent: 'center' },
  bar: { width: 8, borderRadius: Radius.full },
  barPur: { backgroundColor: '#3b82f6' },
  barSale: { backgroundColor: '#10b981' },
  colLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, marginTop: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 10, height: 10, borderRadius: Radius.sm },
  legendText: { fontSize: 11, color: Colors.textSecondary },

  // Top products list
  prodList: { gap: 12 },
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prodRank: { fontSize: 14, fontWeight: '800', color: Colors.textMuted, width: 24 },
  prodName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  prodCat: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  prodRight: { alignItems: 'flex-end' },
  prodStock: { fontSize: 13, fontWeight: '700', color: Colors.accentLight },
  prodPrice: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
});
