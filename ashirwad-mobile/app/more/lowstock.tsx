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

interface Product {
  id: string;
  name: string;
  sku?: string;
  partNumber?: string;
  currentStock: number;
  minStock: number;
  category_name?: string;
  supplier_name?: string;
}

export default function LowStockAlertsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const { data } = await api.get('/products/low-stock');
      setProducts(data || []);
    } catch (err) {
      console.error('Fetch low stock failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Low Stock Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Feather name="check-circle" size={48} color="#10b981" style={{ marginBottom: 12 }} />
          <Text style={styles.noDataText}>All products are sufficiently stocked!</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{item.name}</Text>
                  {item.sku ? <Text style={styles.prodSku}>SKU: {item.sku}</Text> : null}
                  {item.partNumber ? <Text style={styles.prodPart}>Part Number: {item.partNumber}</Text> : null}
                </View>
                <View style={styles.alertIcon}>
                  <Feather name="alert-triangle" size={18} color="#ef4444" />
                </View>
              </View>

              <View style={styles.stockStatus}>
                <View style={styles.stockCol}>
                  <Text style={styles.label}>Current Stock</Text>
                  <Text style={[styles.stockNum, { color: '#ef4444', fontWeight: '800' }]}>{item.currentStock}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stockCol}>
                  <Text style={styles.label}>Min Threshold</Text>
                  <Text style={styles.stockNum}>{item.minStock}</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerMeta}>
                  Category: {item.category_name || 'None'} · Supplier: {item.supplier_name || 'None'}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  noDataText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600', textAlign: 'center' },
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
  prodPart: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  alertIcon: {
    width: 32, height: 32, borderRadius: Radius.md,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  stockStatus: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: Radius.md,
    paddingVertical: 12, marginVertical: Spacing.md,
  },
  stockCol: { alignItems: 'center', flex: 1 },
  divider: { width: 1, height: '60%', backgroundColor: Colors.border },
  label: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  stockNum: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  footer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  footerMeta: { fontSize: 11, color: Colors.textMuted },
});
