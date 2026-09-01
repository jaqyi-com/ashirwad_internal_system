import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import StatCard from '../../components/StatCard';
import ListItem from '../../components/ListItem';
import { Colors, Spacing, Radius } from '../../constants/Colors';

const fmt = (n: number) => n?.toLocaleString('en-IN') ?? '0';
const fmtCur = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
        <View style={{ padding: Spacing.xl, paddingBottom: 28 }}>
          <Skeleton colorMode={colors.bgPrimary === '#000000' || colors.bgPrimary === '#121212' ? 'dark' : 'light'} width={120} height={20} />
          <View style={{ height: 8 }} />
          <Skeleton colorMode={colors.bgPrimary === '#000000' || colors.bgPrimary === '#121212' ? 'dark' : 'light'} width={180} height={28} />
        </View>
        <View style={{ padding: Spacing.lg, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          {[1,2,3,4,5,6].map((i) => (
            <Skeleton key={i} colorMode={colors.bgPrimary === '#000000' || colors.bgPrimary === '#121212' ? 'dark' : 'light'} width="48%" height={120} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const { stats, recentTransactions, topProducts } = data || {};

  const statCards = [
    { label: 'Total Products', value: fmt(stats?.totalProducts), icon: 'package',    color: colors.accentLight, bg: colors.accentGlow },
    { label: 'Total Stock',    value: fmt(stats?.totalStock),    icon: 'layers',      color: colors.blue,        bg: 'rgba(59,130,246,0.12)' },
    { label: 'Inv. Value',     value: fmtCur(stats?.inventoryValue), icon: 'dollar-sign', color: colors.green, bg: 'rgba(16,185,129,0.12)' },
    { label: 'Out of Stock',   value: fmt(stats?.outOfStock),    icon: 'x-circle',    color: colors.red,         bg: 'rgba(239,68,68,0.12)' },
    { label: "Today's Sales",  value: fmtCur(stats?.todaySales?.amount), icon: 'trending-up', color: colors.green, bg: 'rgba(16,185,129,0.12)', sub: `${stats?.todaySales?.count ?? 0} orders` },
    { label: "Today's Purchases", value: fmtCur(stats?.todayPurchases?.amount), icon: 'shopping-cart', color: colors.purple, bg: 'rgba(139,92,246,0.12)', sub: `${stats?.todayPurchases?.count ?? 0} orders` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
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
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stat grid */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Overview</Text>
          <View style={styles.statGrid}>
            {statCards.map((s, index) => (
              <MotiView
                key={s.label}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: index * 50 }}
                style={{ width: '48%' }}
              >
                <StatCard
                  label={s.label}
                  value={s.value}
                  sub={s.sub}
                  color={s.color}
                  bgColor={s.bg}
                  icon={<Feather name={s.icon as any} size={18} color={s.color} />}
                />
              </MotiView>
            ))}
          </View>
        </MotiView>

        {/* Top Products */}
        {topProducts?.length > 0 && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Top Products</Text>
            {topProducts.slice(0, 5).map((p: any) => (
              <ListItem
                key={p.id}
                title={p.name}
                subtitle={p.category?.name ?? 'Uncategorized'}
                rightLabel={`${fmt(p.currentStock)} ${p.unit || 'pcs'}`}
                imageUri={p.productImages?.[0]}
                showChevron={false}
              />
            ))}
          </>
        )}

        {/* Recent transactions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          {recentTransactions?.length > 0 && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Recent Activity</Text>
              {recentTransactions.slice(0, 6).map((t: any, idx: number) => (
                <ListItem
                  key={t.id}
                  index={idx}
                  title={t.product?.name ?? 'Unknown'}
                  subtitle={new Date(t.createdAt).toLocaleDateString('en-IN')}
                  badge={t.transactionType?.replace('_', ' ')}
                  badgeColor={
                    t.transactionType?.includes('IN') ? colors.green : colors.red
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
        </MotiView>

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

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as const,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    rowGap: 12,
  },
};

