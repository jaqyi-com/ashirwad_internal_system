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
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: colors.bgCard,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 110,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={{
        width: 36, height: 36, borderRadius: Radius.sm,
        backgroundColor: bgColor,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.sm,
      }}>
        {icon}
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, fontWeight: '500' }}>{label}</Text>
      {sub && <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{sub}</Text>}
    </TouchableOpacity>
  );
}
