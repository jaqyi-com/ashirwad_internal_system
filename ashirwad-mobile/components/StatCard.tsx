import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing } from '../constants/Colors';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  sub?: string;
  onPress?: () => void;
}

export default function StatCard({ label, value, icon, color, bgColor, sub, onPress }: StatCardProps) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={{
        width: '48%',
        backgroundColor: colors.bgCard,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 120,
        justifyContent: 'space-between',
        // Premium card styling
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 10,
        elevation: 3,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View>
        <View style={{
          width: 38, height: 38, borderRadius: Radius.md,
          backgroundColor: bgColor,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: Spacing.sm,
        }}>
          {icon}
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5, color: colors.textPrimary }}>
          {value}
        </Text>
      </View>

      <View style={{ marginTop: 4 }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
