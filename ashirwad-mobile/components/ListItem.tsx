import React from 'react';
import {
  View, Text, TouchableOpacity, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing } from '../constants/Colors';

interface ListItemProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  imageUri?: string;
  iconPlaceholder?: React.ReactNode;
  rightLabel?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export default function ListItem({
  title,
  subtitle,
  badge,
  badgeColor,
  badgeBg    = 'rgba(16,185,129,0.12)',
  imageUri,
  iconPlaceholder,
  rightLabel,
  onPress,
  showChevron = true,
}: ListItemProps) {
  const { colors } = useTheme();
  const bColor = badgeColor ?? colors.green;

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: Spacing.sm,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left thumbnail */}
      <View style={{ marginRight: Spacing.md, flexShrink: 0 }}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{
              width: 44, height: 44, borderRadius: Radius.sm,
              borderWidth: 1, borderColor: colors.border,
            }}
          />
        ) : (
          <View style={{
            width: 44, height: 44, borderRadius: Radius.sm,
            backgroundColor: colors.bgSecondary,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: colors.border,
          }}>
            {iconPlaceholder ?? (
              <Feather name="package" size={18} color={colors.textMuted} />
            )}
          </View>
        )}
      </View>

      {/* Middle */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: Spacing.sm }}>
        {badge ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: badgeBg }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: bColor }}>{badge}</Text>
          </View>
        ) : null}
        {rightLabel ? (
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>{rightLabel}</Text>
        ) : null}
        {showChevron && (
          <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 2 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}
