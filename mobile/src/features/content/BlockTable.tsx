import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { createStyles } from '@/design';

import { InlineText } from './InlineText';
import type { Inline, TableBlock } from './schema';

export interface BlockTableProps {
  block: TableBlock;
  onLinkPress: (href: string) => void;
}

/**
 * A table whose first column stays put while the rest scrolls sideways, so a
 * wide schedule keeps the course or day in view. The first column is frozen
 * outside a horizontal scroll that holds the other columns; the height of
 * each row is the taller of its two sides, measured once & shared, so the two
 * halves stay lined up however the text wraps.
 */
export function BlockTable({ block, onLinkPress }: BlockTableProps) {
  const styles = useStyles();
  const bodyRows = block.rows;
  const rowKeys = [...(block.header ? ['header'] : []), ...bodyRows.map((_, i) => `row-${i}`)];
  const rows: { key: string; cells: Inline[]; header: boolean }[] = [
    ...(block.header ? [{ key: 'header', cells: block.header, header: true }] : []),
    ...bodyRows.map((cells, i) => ({ key: `row-${i}`, cells, header: false })),
  ];

  const [heights, setHeights] = useState<Record<string, number>>({});
  const report = useCallback((key: string, height: number) => {
    setHeights((prev) => (height > (prev[key] ?? 0) ? { ...prev, [key]: height } : prev));
  }, []);

  if (rows.length === 0) return null;

  const cell = (content: Inline, row: (typeof rows)[number], first: boolean) => {
    const onLayout = (event: LayoutChangeEvent) => report(row.key, event.nativeEvent.layout.height);
    return (
      <View
        style={[
          styles.cell,
          first ? styles.firstCell : styles.bodyCell,
          { height: heights[row.key] },
        ]}
      >
        <View onLayout={onLayout}>
          <InlineText
            content={content}
            variant={row.header ? 'label' : 'callout'}
            color={row.header ? 'textMuted' : 'text'}
            onLinkPress={onLinkPress}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.table}>
      <View style={styles.frozen}>
        {rows.map((row) => (
          <View key={row.key} style={[styles.rowLine, row.header ? styles.headerRow : null]}>
            {cell(row.cells[0] ?? [], row, true)}
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {rows.map((row) => (
            <View key={row.key} style={[styles.rowLine, row.header ? styles.headerRow : null]}>
              {row.cells.slice(1).map((content, index) => (
                <View key={`${rowKeys.length}-${index}`}>{cell(content, row, false)}</View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  table: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  frozen: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowLine: {
    flexDirection: 'row',
  },
  headerRow: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  cell: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  firstCell: {
    minWidth: 120,
    maxWidth: 200,
  },
  bodyCell: {
    minWidth: 120,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
  },
}));
