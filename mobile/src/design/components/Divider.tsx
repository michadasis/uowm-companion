import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';

export interface DividerProps {
  /** Space left clear at the start, to line the rule up with row text. */
  inset?: number;
}

export function Divider({ inset = 0 }: DividerProps) {
  const theme = useTheme();
  return (
    <View style={[styles.rule, { backgroundColor: theme.colors.border, marginLeft: inset }]} />
  );
}

const styles = StyleSheet.create({
  rule: {
    height: StyleSheet.hairlineWidth,
  },
});
