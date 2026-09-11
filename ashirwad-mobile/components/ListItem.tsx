import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
}: ListItemProps) {
  const { colors, isDark } = useTheme();
  const bColor = badgeColor ?? colors.green;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
        isDark ? Shadows.sm : {},
      ]}
    >
      {/* Left thumbnail / Icon capsule */}
      <View style={styles.leftBox}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.border,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.iconPlaceholderBox,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            {iconPlaceholder ?? (
              <Feather name="package" size={20} color={colors.accentLight} />
            )}
          </View>
        )}
      </View>

      {/* Middle: Title & Subtitle */}
      <View style={styles.middleBox}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right: Badge, Value & Chevron */}
      <View style={styles.rightBox}>
        {rightLabel ? (
          <Text
            style={[styles.rightLabel, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {rightLabel}
          </Text>
        ) : null}

        {badge ? (
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: badgeBg,
                borderColor: `${bColor}30`,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: bColor },
              ]}
              numberOfLines={1}
            >
              {badge}
            </Text>
          </View>
        ) : rightSubLabel ? (
          <Text style={[styles.rightSubLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {rightSubLabel}
          </Text>
        ) : null}

        {showChevron && (
          <Feather
            name="chevron-right"
            size={16}
            color={colors.textMuted}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  leftBox: {
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  iconPlaceholderBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  middleBox: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    gap: 6,
  },
  rightLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgeContainer: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rightSubLabel: {
    fontSize: 11,
  },
  chevron: {
    marginLeft: 2,
  },
});
