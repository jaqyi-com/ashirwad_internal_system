import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import StatCard from '../../components/StatCard';
import ListItem from '../../components/ListItem';
import ChatbotModal from '../../components/ChatbotModal';
import { Radius, Spacing, Shadows } from '../../constants/Colors';

const fmt = (n: number) => n?.toLocaleString('en-IN') ?? '0';
const fmtCur = (n: number) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatbotVisible, setChatbotVisible] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: d } = await api.get('/dashboard');
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    const skColor = isDark ? 'dark' : 'light';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
        <View style={{ padding: Spacing.lg, gap: 16 }}>
          <Skeleton colorMode={skColor} width="100%" height={140} radius={Radius.xl} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} colorMode={skColor} width="22%" height={70} radius={Radius.md} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} colorMode={skColor} width="48%" height={124} radius={Radius.lg} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, recentTransactions, topProducts } = data || {};

  const quickActions = [
    { label: 'New Sale', icon: 'trending-up', color: colors.green, bg: colors.greenGlow, route: '/(tabs)/sales' },
    { label: 'Add Product', icon: 'plus-circle', color: colors.accentLight, bg: colors.accentGlow, route: '/(tabs)/products' },
    { label: 'Purchase PO', icon: 'shopping-bag', color: colors.purple, bg: colors.purpleGlow, route: '/(tabs)/purchases' },
    { label: 'Movements', icon: 'refresh-cw', color: colors.blue, bg: colors.blueGlow, route: '/more/movements' },
  ];

  const statCards = [
    {
      label: 'Total Products',
      value: fmt(stats?.totalProducts),
      icon: <Feather name="package" size={20} color={colors.accentLight} />,
      color: colors.accentLight,
      bgColor: colors.accentGlow,
      sub: `${stats?.categoriesCount ?? 0} categories`,
    },
    {
      label: 'Total Stock Units',
      value: fmt(stats?.totalStock),
      icon: <Feather name="layers" size={20} color={colors.blue} />,
      color: colors.blue,
      bgColor: colors.blueGlow,
      sub: `${stats?.lowStock ?? 0} low stock`,
    },
    {
      label: "Today's Sales",
      value: fmtCur(stats?.todaySales?.amount),
      icon: <Feather name="trending-up" size={20} color={colors.green} />,
      color: colors.green,
      bgColor: colors.greenGlow,
      sub: `${stats?.todaySales?.count ?? 0} orders`,
    },
    {
      label: 'Out of Stock',
      value: fmt(stats?.outOfStock),
      icon: <Feather name="alert-triangle" size={20} color={stats?.outOfStock > 0 ? colors.red : colors.green} />,
      color: stats?.outOfStock > 0 ? colors.red : colors.green,
      bgColor: stats?.outOfStock > 0 ? colors.redGlow : colors.greenGlow,
      sub: stats?.outOfStock > 0 ? 'Action required' : 'Optimal',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View>
          <View style={styles.brandRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Ashirwad IMS</Text>
          </View>
          <Text style={[styles.greetingSub, { color: colors.textMuted }]}>
            Good {getGreeting()}, {user?.name?.split(' ')[0] ?? 'User'} 👋
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setChatbotVisible(true)}
            style={[
              styles.aiTopBtn,
              { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#ede9fe', borderColor: isDark ? 'rgba(99,102,241,0.35)' : '#c7d2fe' },
            ]}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.aiTopIconCircle}
            >
              <Feather name="cpu" size={13} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.aiTopText, { color: colors.accentLight }]}>Ask AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/more')}
            style={[styles.avatarCapsule, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.accentGlow }]}>
              <Text style={[styles.avatarText, { color: colors.accentLight }]}>
                {(user?.name ?? 'U')[0].toUpperCase()}
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Executive Highlight Hero Banner ── */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <LinearGradient
            colors={isDark ? ['#1e1b4b', '#2e1065', '#172554'] : ['#4338ca', '#6d28d9', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, Shadows.lg]}
          >
            <View style={styles.bannerHeader}>
              <View>
                <Text style={styles.bannerLabel}>TOTAL INVENTORY VALUE</Text>
                <Text style={styles.bannerValue}>{fmtCur(stats?.inventoryValue)}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Feather name="activity" size={13} color="#34d399" />
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            </View>

            <View style={styles.bannerDivider} />

            <View style={styles.bannerFooter}>
              <View>
                <Text style={styles.bannerFooterSub}>Today's Purchases</Text>
                <Text style={styles.bannerFooterVal}>{fmtCur(stats?.todayPurchases?.amount)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bannerFooterSub}>Active Stock Units</Text>
                <Text style={styles.bannerFooterVal}>{fmt(stats?.totalStock)} units</Text>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* ── AI Inventory Assistant Interactive Banner ── */}
        <TouchableOpacity
          onPress={() => setChatbotVisible(true)}
          activeOpacity={0.85}
          style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}
        >
          <LinearGradient
            colors={isDark ? ['#1e1b4b', '#131322'] : ['#ede9fe', '#f8fafc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.aiBanner,
              { borderColor: isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.25)' },
              Shadows.sm,
            ]}
          >
            <View style={styles.aiBannerLeft}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.aiBannerIconBox}
              >
                <Feather name="cpu" size={18} color="#ffffff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.aiBannerTitle, { color: colors.textPrimary }]}>
                    Ashirwad AI Assistant
                  </Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>ASK INVENTORY</Text>
                  </View>
                </View>
                <Text style={[styles.aiBannerSub, { color: colors.textSecondary }]}>
                  Instant stock checks, rates, locations, or sales (English & Hindi)
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.accentLight} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Quick Actions ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((qa, i) => (
            <TouchableOpacity
              key={qa.label}
              onPress={() => router.push(qa.route as any)}
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
                isDark ? Shadows.sm : {},
              ]}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: qa.bg }]}>
                <Feather name={qa.icon as any} size={18} color={qa.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {qa.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Metric Grid ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>BUSINESS OVERVIEW</Text>
        </View>
        <View style={styles.statGrid}>
          {statCards.map((s, index) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              color={s.color}
              bgColor={s.bgColor}
              icon={s.icon}
              width="48.5%"
            />
          ))}
        </View>

        {/* ── Top Products ── */}
        {topProducts?.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TOP PRODUCTS</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={[styles.sectionAction, { color: colors.accentLight }]}>View All</Text>
              </TouchableOpacity>
            </View>

            {topProducts.slice(0, 5).map((p: any, idx: number) => (
              <ListItem
                key={p.id}
                index={idx}
                title={p.name}
                subtitle={`${p.category?.name ?? 'General'} · P/N: ${p.partNumber || '—'}`}
                rightLabel={`${fmt(p.currentStock)} ${p.unit || 'pcs'}`}
                rightSubLabel={p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : undefined}
                imageUri={p.productImages?.[0]}
                onPress={() => router.push('/(tabs)/products')}
              />
            ))}
          </>
        )}

        {/* ── Recent Activity ── */}
        {recentTransactions?.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECENT ACTIVITY</Text>
              <TouchableOpacity onPress={() => router.push('/more/movements')}>
                <Text style={[styles.sectionAction, { color: colors.accentLight }]}>View Log</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.slice(0, 6).map((t: any, idx: number) => {
              const isIn = t.transactionType?.includes('IN') || t.transactionType === 'PURCHASE';
              return (
                <ListItem
                  key={t.id}
                  index={idx}
                  title={t.product?.name ?? 'Product Activity'}
                  subtitle={`${new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · ${t.quantity > 0 ? '+' : ''}${t.quantity} ${t.product?.unit || 'pcs'}`}
                  badge={t.transactionType?.replace('_', ' ')}
                  badgeColor={isIn ? colors.green : colors.red}
                  badgeBg={isIn ? colors.greenGlow : colors.redGlow}
                  onPress={() => router.push('/more/movements')}
                  showChevron={false}
                />
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── AI Chatbot Modal ── */}
      <ChatbotModal
        visible={chatbotVisible}
        onClose={() => setChatbotVisible(false)}
        onSelectProduct={(term) => router.push({ pathname: '/(tabs)/products', params: { search: term } })}
      />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  greetingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  avatarCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroBanner: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.8,
  },
  bannerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: Spacing.md,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerFooterSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  bannerFooterVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  quickActionCard: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: Spacing.md,
  },
  aiTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  aiTopIconCircle: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTopText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  aiBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  aiBadgeText: {
    color: '#818cf8',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  aiBannerSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});


