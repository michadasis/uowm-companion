import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import {
  Chip,
  createStyles,
  Divider,
  ListRow,
  SearchField,
  SectionHeader,
  StateView,
} from '@/design';
import type { Language } from '@/features/settings/store';

import type { Department, Directory, School } from './schema';
import { filterDirectory } from './search';
import type { DirectoryFilter } from './search';

type Row =
  | { kind: 'school'; key: string; school: School; count: number }
  | { kind: 'department'; key: string; department: Department; first: boolean; last: boolean };

export interface DepartmentPickerProps {
  directory: Directory;
  selectedId: string | null;
  onSelect: (departmentId: string) => void;
  /** Shown above the search field and scrolls away with the list. */
  header?: ReactNode;
}

/**
 * The searchable list of departments, grouped by school, with the city as a
 * filter. Schools are the headings because that is how the university is
 * organised; a school can span three cities, so the city is on each row.
 */
export function DepartmentPicker({
  directory,
  selectedId,
  onSelect,
  header,
}: DepartmentPickerProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const styles = useStyles();
  const listRef = useRef<FlashListRef<Row>>(null);
  const [filter, setFilter] = useState<DirectoryFilter>({ query: '', cityId: null });
  const { query, cityId } = filter;

  // A different filter is a different list, so it is read from the top.
  const applyFilter = (next: Partial<DirectoryFilter>) => {
    setFilter({ ...filter, ...next });
    listRef.current?.scrollToTop({ animated: false });
  };

  const sections = filterDirectory(directory, filter);
  const rows: Row[] = sections.flatMap(({ school, departments }) => [
    { kind: 'school', key: `school:${school.id}`, school, count: departments.length },
    ...departments.map((department, index): Row => ({
      kind: 'department',
      key: department.id,
      department,
      first: index === 0,
      last: index === departments.length - 1,
    })),
  ]);
  const cityNames = new Map(directory.cities.map((city) => [city.id, city.name[language]]));

  return (
    <FlashList
      ref={listRef}
      data={rows}
      extraData={[selectedId, language]}
      getItemType={(row) => row.kind}
      keyExtractor={(row) => row.key}
      // By default the list keeps the rows on screen where they are when the
      // data changes, which suits a chat. Here it would leave a cleared
      // filter scrolled to wherever the last results happen to sit.
      maintainVisibleContentPosition={{ disabled: true }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View>
          {header}
          <View style={styles.search}>
            <SearchField
              value={query}
              onChangeText={(text) => applyFilter({ query: text })}
              placeholder={t('departmentPicker.searchPlaceholder')}
              clearLabel={t('departmentPicker.clearSearch')}
              testID="department-search"
            />
          </View>
          <ScrollView
            horizontal
            accessibilityLabel={t('departmentPicker.cities')}
            contentContainerStyle={styles.cities}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            <Chip
              label={t('departmentPicker.allCities')}
              selected={cityId === null}
              onPress={() => applyFilter({ cityId: null })}
              testID="city-all"
            />
            {directory.cities.map((city) => (
              <Chip
                key={city.id}
                label={city.name[language]}
                selected={cityId === city.id}
                onPress={() => applyFilter({ cityId: cityId === city.id ? null : city.id })}
                testID={`city-${city.id}`}
              />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <StateView
            kind="empty"
            icon="search"
            title={t('departmentPicker.noResults.title')}
            message={t('departmentPicker.noResults.message')}
            action={{
              label: t('departmentPicker.noResults.clear'),
              onPress: () => applyFilter({ query: '', cityId: null }),
            }}
          />
        </View>
      }
      renderItem={({ item }) =>
        item.kind === 'school' ? (
          <SectionHeader title={item.school.name[language]} detail={String(item.count)} />
        ) : (
          <View
            style={[
              styles.row,
              item.first ? styles.firstRow : null,
              item.last ? styles.lastRow : null,
            ]}
          >
            <ListRow
              title={item.department.shortName[language]}
              subtitle={cityNames.get(item.department.city)}
              trailing="check"
              selected={item.department.id === selectedId}
              accessibilityRole="radio"
              onPress={() => onSelect(item.department.id)}
              testID={`department-${item.department.id}`}
            />
            {item.last ? null : <Divider inset={16} />}
          </View>
        )
      }
    />
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingBottom: theme.spacing[6],
  },
  search: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
  },
  cities: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    gap: theme.spacing[2],
  },
  // Rows of one school read as a single card, though each is its own list
  // item so the list can recycle them.
  row: {
    marginHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  firstRow: {
    borderTopWidth: 1,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  lastRow: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
  empty: {
    paddingTop: theme.spacing[8],
  },
}));
