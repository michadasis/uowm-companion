import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { createStyles, useTheme } from '../theme';
import { typography } from '../tokens/typography';

import { Icon } from './Icon';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Read out for the button that empties the field. */
  clearLabel: string;
  testID?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  clearLabel,
  testID,
}: SearchFieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, focused ? styles.focused : null]}>
      <Icon name="search" size={theme.size.icon.sm} color="textSubtle" />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        maxFontSizeMultiplier={typography.body.maxScale}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubtle}
        returnKeyType="search"
        selectionColor={theme.colors.primary}
        style={styles.input}
        testID={testID}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          hitSlop={12}
          onPress={() => onChangeText('')}
          style={styles.clear}
        >
          <Icon name="close" size={14} color="textMuted" weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  field: {
    height: theme.size.touchTarget,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  focused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: theme.colors.text,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    includeFontPadding: false,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
