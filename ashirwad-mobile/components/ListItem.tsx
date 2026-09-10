import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiPressable } from 'moti/interactions';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing, Shadows } from '../constants/Colors';

interface ListItemProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  imageUri?: string;
  iconPlaceholder?: React.ReactNode;
  rightLabel?: string;
  rightSubLabel?: string;
  onPress?: () => void;
  showChevron?: boolean;
  index?: number;
}

export default function ListItem({
  title,
  subtitle,
  badge,
  badgeColor,
  badgeBg = 'rgba(16,185,129,0.12)',
  imageUri,
  iconPlaceholder,
  rightLabel,
  rightSubLabel,
  onPress,
  showChevron = true,
  index = 0,
}: ListItemProps) {
  const { colors, isDark } = useTheme();
  const bColor = badgeColor ?? colors.green;

  return (
    <MotiPressable
      from={{ opacity: 0, translateY: 12 }}
      animate={useMemo(
        () =>
          ({ pressed }) => {
            'worklet';
            return {
              opacity: 1,
              translateY: 0,
              scale: pressed ? 0.98 : 1,
            };
          },
        []
      )}
      transition={{ type: 'timing', duration: 250, delay: Math.min(index * 35, 300) }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: Spacing.sm,
        ...(isDark ? Shadows.sm : {}),
      }}
    >
      {/* Left thumbnail / Icon capsule */}
      <View style={{ marginRight: Spacing.md, flexShrink: 0 }}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{
              width: 46,
              height: 46,
              borderRadius: Radius.md,
              backgroundColor: colors.bgSecondary,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        ) : (
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: Radius.md,
              backgroundColor: colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {iconPlaceholder ?? (
              <Feather name="package" size={20} color={colors.accentLight} />
            )}
          </View>
        )}
      </View>

      {/* Middle: Title & Subtitle */}
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        <Text
          style={{
            fontSize: 14.5,
            fontWeight: '700',
            color: colors.textPrimary,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 2.5,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right: Badge, Value & Chevron */}
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: Spacing.sm,
          gap: 3,
        }}
      >
        {rightLabel ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.textPrimary,
              letterSpacing: -0.2,
            }}
          >
            {rightLabel}
          </Text>
        ) : null}

        {badge ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              borderRadius: Radius.full,
              backgroundColor: badgeBg,
              borderWidth: 1,
              borderColor: `${bColor}30`,
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: '700',
                color: bColor,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              {badge}
            </Text>
          </View>
        ) : rightSubLabel ? (
          <Text style={{ fontSize: 11, color: colors.textMuted }}>{rightSubLabel}</Text>
        ) : null}
      </View>

      {showChevron && (
        <Feather
          name="chevron-right"
          size={16}
          color={colors.textMuted}
          style={{ marginLeft: 6 }}
        />
      )}
    </MotiPressable>
  );
}

