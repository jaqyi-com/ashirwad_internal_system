import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing } from '../constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  filterButton?: React.ReactNode;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  filterButton,
}: SearchBarProps) {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bgCard,
          borderRadius: Radius.lg,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm + 3,
          borderWidth: 1.5,
          borderColor: isFocused ? colors.accent : colors.border,
          gap: 10,
        }}
      >
        <Feather
          name="search"
          size={16}
          color={isFocused ? colors.accentLight : colors.textMuted}
        />
        <TextInput
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontSize: 14,
            fontWeight: '500',
            padding: 0,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear ?? (() => onChangeText(''))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="x" size={12} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {filterButton}
    </View>
  );
}

