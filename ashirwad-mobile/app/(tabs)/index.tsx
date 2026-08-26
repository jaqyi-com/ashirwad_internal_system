import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuth } from '../../store/authStore';
import StatCard from '../../components/StatCard';
import ListItem from '../../components/ListItem';
import { Colors, Spacing, Radius } from '../../constants/Colors';

const fmt = (n: number) => n?.toLocaleString('en-IN') ?? '0';
const fmtCur = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: d } = await api.get('/dashboard');
      setData(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const { stats, recentTransactions, topProducts } = data || {};

  const statCards = [
    { label: 'Total Products', value: fmt(stats?.totalProducts), icon: 'package',    color: Colors.accentLight, bg: Colors.accentGlow },
    { label: 'Total Stock',    value: fmt(stats?.totalStock),    icon: 'layers',      color: Colors.blue,        bg: 'rgba(59,130,246,0.12)' },
    { label: 'Inv. Value',     value: fmtCur(stats?.inventoryValue), icon: 'dollar-sign', color: Colors.green, bg: 'rgba(16,185,129,0.12)' },
    { label: 'Out of Stock',   value: fmt(stats?.outOfStock),    icon: 'x-circle',    color: Colors.red,         bg: 'rgba(239,68,68,0.12)' },
    { label: "Today's Sales",  value: fmtCur(stats?.todaySales?.amount), icon: 'trending-up', color: Colors.green, bg: 'rgba(16,185,129,0.12)', sub: `${stats?.todaySales?.count ?? 0} orders` },
    { label: "Today's Purchases", value: fmtCur(stats?.todayPurchases?.amount), icon: 'shopping-cart', color: Colors.purple, bg: 'rgba(139,92,246,0.12)', sub: `${stats?.todayPurchases?.count ?? 0} orders` },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header gradient */}
      <LinearGradient
        colors={['#3730a3', '#6d28d9']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View>
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name ?? 'User'} 👋</Text>
        </View>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>
            {(user?.name ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stat grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statGrid}>
          {statCards.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              color={s.color}
              bgColor={s.bg}
              icon={<Feather name={s.icon as any} size={18} color={s.color} />}
            />
          ))}
        </View>

        {/* Top Products */}
        {topProducts?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Products</Text>
            {topProducts.slice(0, 5).map((p: any) => (
              <ListItem
                key={p.id}
                title={p.name}
                subtitle={p.category?.name ?? 'Uncategorized'}
                rightLabel={`${fmt(p.currentStock)} ${p.unit}`}
                imageUri={p.productImages?.[0]}
                showChevron={false}
              />
            ))}
          </>
        )}

        {/* Recent transactions */}
        {recentTransactions?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentTransactions.slice(0, 6).map((t: any) => (
              <ListItem
                key={t.id}
                title={t.product?.name ?? 'Unknown'}
                subtitle={new Date(t.createdAt).toLocaleDateString('en-IN')}
                badge={t.transactionType?.replace('_', ' ')}
                badgeColor={
                  t.transactionType?.includes('IN') ? Colors.green : Colors.red
                }
                badgeBg={
                  t.transactionType?.includes('IN')
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(239,68,68,0.12)'
                }
                showChevron={false}
              />
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    paddingBottom: 28,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  userName:  { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarBox: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
