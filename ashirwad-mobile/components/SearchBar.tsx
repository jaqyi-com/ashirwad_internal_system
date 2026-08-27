import React from 'react';
import {
  View, TextInput, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing } from '../constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderWidth: 1.5,
      borderColor: colors.border,
      gap: 10,
      marginBottom: Spacing.md,
    }}>
      <Feather name="search" size={16} color={colors.textMuted} />
      <TextInput
        style={{ flex: 1, color: colors.textPrimary, fontSize: 14 }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear ?? (() => onChangeText(''))}>
          <Feather name="x" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}
