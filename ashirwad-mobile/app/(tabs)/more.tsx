import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface MenuRow {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  const sections: { title: string; iconColor: string; iconBg: string; rows: MenuRow[] }[] = [
    {
      title: 'Inventory & CRM',
      iconColor: '#6366f1',
      iconBg: 'rgba(99,102,241,0.12)',
      rows: [
        { icon: 'users', label: 'Suppliers',  sub: 'Manage vendor database & contacts',  onPress: () => router.push('/more/suppliers') },
        { icon: 'user',  label: 'Customers',  sub: 'Customer accounts & directory',  onPress: () => router.push('/more/customers') },
        { icon: 'tag',   label: 'Categories', sub: 'Product taxonomy & groups',  onPress: () => router.push('/more/categories') },
        { icon: 'bar-chart-2', label: 'Reports', sub: 'Financial analytics & inventory stats', onPress: () => router.push('/more/reports') },
      ],
    },
    {
      title: 'Stock Operations',
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.12)',
      rows: [
        { icon: 'refresh-cw',    label: 'Stock Movements',   sub: 'In/Out audit trail & history',   onPress: () => router.push('/more/movements') },
        { icon: 'sliders',       label: 'Stock Adjustments', sub: 'Manual quantity corrections',    onPress: () => router.push('/more/adjustments') },
        { icon: 'alert-triangle',label: 'Low Stock Alerts',  sub: 'Items near safety stock threshold', onPress: () => router.push('/more/lowstock') },
      ],
    },
    {
      title: 'Logistics & HR',
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.12)',
      rows: [
        { icon: 'file-text', label: 'Delivery Challans', sub: 'Shipping & dispatch manifests', onPress: () => router.push('/more/challans') },
        { icon: 'message-square', label: 'Complaints', sub: 'Quality issues & customer tickets', onPress: () => router.push('/more/complaints') },
        { icon: 'clock', label: 'Attendance', sub: 'Biometric device & punch logs', onPress: () => router.push('/more/attendance') },
      ],
    },
    {
      title: 'System & Security',
      iconColor: '#8b5cf6',
      iconBg: 'rgba(139,92,246,0.12)',
      rows: [
        { icon: 'shield', label: 'User Management', sub: 'Access roles & permissions', onPress: () => router.push('/more/users') },
        { icon: 'clipboard', label: 'Audit Logs', sub: 'Security & activity history', onPress: () => router.push('/more/audit') },
        { icon: 'settings', label: 'Settings', sub: 'System configuration & coatings', onPress: () => router.push('/more/settings') },
      ],
    },
    {
      title: 'Account',
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.12)',
      rows: [
        {
          icon: 'log-out', label: 'Sign Out', sub: user?.email ?? '',
          onPress: handleLogout, danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings & More</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Ashirwad Manufacturing Systems</Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: '#10b981' }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile VIP card */}
        <View style={[styles.profileCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.accentLight }]}>
              {(user?.name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name ?? 'System User'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email ?? '—'}</Text>
            <View style={styles.profileBadgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
                <Feather name="shield" size={10} color={colors.accentLight} style={{ marginRight: 4 }} />
                <Text style={[styles.roleBadgeText, { color: colors.accentLight }]}>{user?.role ?? 'ADMIN'}</Text>
              </View>
              <View style={[styles.orgBadge, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <Text style={[styles.orgBadgeText, { color: colors.textMuted }]}>Ashirwad IMS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Theme Toggle ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                <Feather
                  name={isDark ? 'moon' : 'sun'}
                  size={18}
                  color={isDark ? '#a78bfa' : '#f59e0b'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                  {isDark ? 'Obsidian Dark Mode' : 'Crisp Light Mode'}
                </Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                  {isDark ? 'Tailored for low-light enterprise use' : 'High-contrast day display'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={isDark ? '#fff' : '#f4f4f5'}
              />
            </View>
          </View>
        </View>

        {/* ── Menu Sections ── */}
        {sections.map((section, sectionIdx) => (
          <MotiView
            key={section.title}
            style={styles.section}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: (sectionIdx + 1) * 80 }}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              {section.rows.map((row, idx) => (
                <TouchableOpacity
                  key={row.label}
                  style={[
                    styles.menuRow,
                    idx < section.rows.length - 1 && [styles.menuRowBorder, { borderBottomColor: colors.border }],
                  ]}
                  onPress={row.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.menuIcon,
                    { backgroundColor: row.danger ? 'rgba(239,68,68,0.12)' : section.iconBg },
                  ]}>
                    <Feather
                      name={row.icon as any}
                      size={17}
                      color={row.danger ? '#ef4444' : section.iconColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.menuLabel,
                      { color: row.danger ? '#ef4444' : colors.textPrimary },
                    ]}>{row.label}</Text>
                    {row.sub ? (
                      <Text style={[styles.menuSub, { color: colors.textMuted }]}>{row.sub}</Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>
        ))}

        {/* Footer Build Tag */}
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textMuted }]}>Ashirwad IMS v1.0.1 (Build 2)</Text>
          <Text style={[styles.buildSub, { color: colors.textMuted }]}>Enterprise Cloud Synced</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  profileBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  orgBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  orgBadgeText: { fontSize: 10, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: Spacing.xs, paddingLeft: 4,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuSub: { fontSize: 11, marginTop: 1 },
  footer: { alignItems: 'center', marginTop: Spacing.lg, paddingBottom: 20 },
  version: { fontSize: 12, fontWeight: '700' },
  buildSub: { fontSize: 10, marginTop: 2 },
});
