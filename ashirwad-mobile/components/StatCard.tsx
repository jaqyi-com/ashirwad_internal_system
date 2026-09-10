import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MotiPressable } from 'moti/interactions';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing, Shadows } from '../constants/Colors';

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
    <MotiPressable
      animate={useMemo(
        () =>
          ({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.96 : 1,
            };
          },
        []
      )}
      onPress={onPress}
      style={{
        width: width as any,
        backgroundColor: colors.bgCard,
        borderRadius: Radius.lg,
        padding: Spacing.md + 2,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 124,
        justifyContent: 'space-between',
        ...(isDark ? Shadows.md : Shadows.sm),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: Radius.md,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          {icon}
        </View>

        {sub ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: Radius.full,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.textMuted,
              }}
              numberOfLines={1}
            >
              {sub}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: Spacing.sm }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            letterSpacing: -0.6,
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text
          style={{
            fontSize: 11.5,
            color: colors.textSecondary,
            fontWeight: '600',
            marginTop: 2,
            letterSpacing: 0.2,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </MotiPressable>
  );
}

