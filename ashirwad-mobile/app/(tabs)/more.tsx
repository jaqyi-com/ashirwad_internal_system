import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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

  const sections: { title: string; rows: MenuRow[] }[] = [
    {
      title: 'Inventory',
      rows: [
        { icon: 'users', label: 'Suppliers',  sub: 'View all suppliers',  onPress: () => router.push('/more/suppliers') },
        { icon: 'user',  label: 'Customers',  sub: 'View all customers',  onPress: () => router.push('/more/customers') },
        { icon: 'tag',   label: 'Categories', sub: 'Product categories',  onPress: () => router.push('/more/categories') },
        { icon: 'bar-chart-2', label: 'Reports', sub: 'Analytics & insights', onPress: () => router.push('/more/reports') },
      ],
    },
    {
      title: 'Stock',
      rows: [
        { icon: 'refresh-cw',    label: 'Stock Movements',   sub: 'Inventory audit trail',   onPress: () => router.push('/more/movements') },
        { icon: 'sliders',       label: 'Stock Adjustments', sub: 'Correct stock levels',    onPress: () => router.push('/more/adjustments') },
        { icon: 'alert-triangle',label: 'Low Stock Alerts',  sub: 'Items that need restocking', onPress: () => router.push('/more/lowstock') },
      ],
    },
    {
      title: 'Operations',
      rows: [
        { icon: 'clock', label: 'Attendance', sub: 'Biometric logs & devices', onPress: () => router.push('/more/attendance') },
      ],
    },
    {
      title: 'Account',
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
      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentLight }]}>
            {(user?.name ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name ?? '—'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email ?? '—'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
            <Text style={[styles.roleBadgeText, { color: colors.accentLight }]}>{user?.role ?? 'User'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Theme Toggle ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.accentGlow }]}>
                <Feather
                  name={isDark ? 'moon' : 'sun'}
                  size={17}
                  color={colors.accentLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                  {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.accentGlow }}
                thumbColor={isDark ? colors.accentLight : colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* ── Other Sections ── */}
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
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
                    { backgroundColor: row.danger ? 'rgba(239,68,68,0.12)' : colors.accentGlow },
                  ]}>
                    <Feather
                      name={row.icon as any}
                      size={17}
                      color={row.danger ? colors.red : colors.accentLight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.menuLabel,
                      { color: row.danger ? colors.red : colors.textPrimary },
                    ]}>{row.label}</Text>
                    {row.sub ? (
                      <Text style={[styles.menuSub, { color: colors.textMuted }]}>{row.sub}</Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.version, { color: colors.textMuted }]}>Ashirwad IMS · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: Spacing.sm, paddingLeft: 4,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1 },
  menuIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '600' },
  menuSub: { fontSize: 11, marginTop: 1 },
  version: {
    textAlign: 'center', fontSize: 11,
    marginTop: Spacing.lg,
  },
});
