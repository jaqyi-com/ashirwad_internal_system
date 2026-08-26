import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../store/authStore';
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
        { icon: 'users', label: 'Suppliers',  sub: 'View all suppliers',  onPress: () => {} },
        { icon: 'user',  label: 'Customers',  sub: 'View all customers',  onPress: () => {} },
        { icon: 'tag',   label: 'Categories', sub: 'Product categories',  onPress: () => {} },
        { icon: 'bar-chart-2', label: 'Reports', sub: 'Analytics & insights', onPress: () => {} },
      ],
    },
    {
      title: 'Stock',
      rows: [
        { icon: 'refresh-cw',    label: 'Stock Movements',   sub: 'Inventory audit trail',   onPress: () => {} },
        { icon: 'sliders',       label: 'Stock Adjustments', sub: 'Correct stock levels',    onPress: () => {} },
        { icon: 'alert-triangle',label: 'Low Stock Alerts',  sub: 'Items that need restocking', onPress: () => {} },
      ],
    },
    {
      title: 'Account',
      rows: [
        { icon: 'settings', label: 'Settings', sub: 'App preferences', onPress: () => {} },
        {
          icon: 'log-out', label: 'Sign Out', sub: user?.email ?? '',
          onPress: handleLogout, danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role ?? 'User'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, idx) => (
                <TouchableOpacity
                  key={row.label}
                  style={[
                    styles.menuRow,
                    idx < section.rows.length - 1 && styles.menuRowBorder,
                  ]}
                  onPress={row.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.menuIcon,
                    { backgroundColor: row.danger ? 'rgba(239,68,68,0.12)' : Colors.accentGlow },
                  ]}>
                    <Feather
                      name={row.icon as any}
                      size={17}
                      color={row.danger ? Colors.red : Colors.accentLight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.menuLabel,
                      row.danger && { color: Colors.red },
                    ]}>{row.label}</Text>
                    {row.sub ? (
                      <Text style={styles.menuSub}>{row.sub}</Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>Ashirwad IMS · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.bgCard,
    margin: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    background: Colors.accentGlow,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.accent,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: Colors.accentLight },
  profileName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  profileEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.accent,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.accentLight, textTransform: 'uppercase' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: Spacing.sm, paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  menuSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  version: {
    textAlign: 'center', fontSize: 11,
    color: Colors.textMuted, marginTop: Spacing.lg,
  },
});
