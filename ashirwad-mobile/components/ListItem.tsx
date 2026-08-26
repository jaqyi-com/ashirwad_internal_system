import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../constants/Colors';

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
  badgeColor = Colors.green,
  badgeBg    = 'rgba(16,185,129,0.12)',
  imageUri,
  iconPlaceholder,
  rightLabel,
  onPress,
  showChevron = true,
}: ListItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      {/* Left — thumbnail or icon */}
      <View style={styles.thumb}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbImg} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            {iconPlaceholder ?? (
              <Feather name="package" size={18} color={Colors.textMuted} />
            )}
          </View>
        )}
      </View>

      {/* Middle — name + sub */}
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      {/* Right — badge / label + chevron */}
      <View style={styles.right}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        ) : null}
        {rightLabel ? (
          <Text style={styles.rightLabel}>{rightLabel}</Text>
        ) : null}
        {showChevron && (
          <Feather name="chevron-right" size={16} color={Colors.textMuted} style={styles.chevron} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  thumb: {
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  thumbImg: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    marginLeft: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rightLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chevron: {
    marginLeft: 2,
  },
});
