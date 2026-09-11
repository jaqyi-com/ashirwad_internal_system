import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../store/themeStore';
import { Radius, Shadows } from '../constants/Colors';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  sub?: string;
  onPress?: () => void;
  width?: string | number;
}

export default function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
  sub,
  onPress,
  width = '48%',
}: StatCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[
        styles.card,
        {
          width: width as any,
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
        isDark ? Shadows.sm : {},
      ]}
    >
      {/* Top row: Icon + Sub badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: bgColor,
            },
          ]}
        >
          {icon}
        </View>

        {sub ? (
          <View
            style={[
              styles.subBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text
              style={[styles.subText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {sub}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom info: Large value + 2-line label */}
      <View style={styles.content}>
        <Text
          style={[styles.value, { color: colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    minHeight: 116,
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    maxWidth: '55%',
  },
  subText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  content: {
    marginTop: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
});
