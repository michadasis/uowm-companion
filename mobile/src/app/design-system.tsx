import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import {
  Button,
  Card,
  CardSkeleton,
  Chip,
  createStyles,
  Divider,
  ListRow,
  ListRowSkeleton,
  NavBar,
  OfflineNotice,
  Screen,
  SearchField,
  SectionHeader,
  SegmentedControl,
  SkeletonGroup,
  StateView,
  Text,
  useTheme,
} from '@/design';
import type { Theme } from '@/design';
import { useSettings } from '@/features/settings/store';
import { showDeveloperTools } from '@/lib/env';

const swatches: (keyof Theme['colors'])[] = [
  'background',
  'surface',
  'surfaceMuted',
  'border',
  'borderStrong',
  'text',
  'textMuted',
  'textSubtle',
  'primary',
  'primaryMuted',
  'accent',
  'accentMuted',
  'danger',
  'dangerMuted',
  'success',
  'successMuted',
];

const typeSamples: [variant: keyof Theme['typography'], sample: string][] = [
  ['display', 'Καλημέρα'],
  ['title', 'Ανακοινώσεις'],
  ['heading', 'Πρόγραμμα εξεταστικής'],
  ['subheading', 'Τμήμα Πληροφορικής'],
  ['body', 'Η δήλωση μαθημάτων λήγει την Παρασκευή.'],
  ['callout', 'Αίθουσα Α2, 09:00 έως 12:00'],
  ['label', 'Χειμερινό εξάμηνο'],
  ['caption', 'Τελευταία ενημέρωση 12:40'],
  ['overline', 'ΣΧΟΛΗ ΘΕΤΙΚΩΝ ΕΠΙΣΤΗΜΩΝ'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View>
      <SectionHeader title={title} />
      <View style={styles.section}>{children}</View>
    </View>
  );
}

/**
 * Every component of the design system on one screen, in the current theme.
 * It is how the system gets reviewed on a real device, and it is not part
 * of the app students use.
 */
export default function DesignSystemScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useStyles();
  const themePreference = useSettings((settings) => settings.theme);
  const setTheme = useSettings((settings) => settings.setTheme);
  const [chip, setChip] = useState('kastoria');
  const [segment, setSegment] = useState<'exams' | 'classes'>('exams');
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState('cs');

  if (!showDeveloperTools) return <Redirect href="/" />;

  return (
    <Screen edges={['top', 'bottom']} testID="design-system-screen">
      <NavBar title="Design system" onBack={() => router.back()} backLabel="Back" />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Theme">
          <SegmentedControl
            accessibilityLabel="Theme"
            options={[
              { value: 'system', label: 'Device' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={themePreference}
            onChange={setTheme}
            testID="gallery-theme"
          />
        </Section>

        <Section title="Colour">
          <View style={styles.swatches}>
            {swatches.map((name) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchColour, { backgroundColor: theme.colors[name] }]} />
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Type">
          <Card>
            <View style={styles.stack}>
              {typeSamples.map(([variant, sample]) => (
                <View key={variant}>
                  <Text variant="caption" color="textSubtle">
                    {variant}
                  </Text>
                  <Text variant={variant}>{sample}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Buttons">
          <View style={styles.stack}>
            <Button label="Συνέχεια" onPress={() => {}} />
            <Button label="Δοκίμασε ξανά" onPress={() => {}} variant="secondary" icon="retry" />
            <Button label="Προβολή όλων" onPress={() => {}} variant="ghost" />
            <Button label="Φόρτωση" onPress={() => {}} loading />
            <Button label="Μη διαθέσιμο" onPress={() => {}} disabled />
          </View>
        </Section>

        <Section title="Chips">
          <View style={styles.wrap}>
            {['kozani', 'florina', 'kastoria', 'ptolemaida'].map((value) => (
              <Chip
                key={value}
                label={value}
                selected={chip === value}
                onPress={() => setChip(value)}
              />
            ))}
          </View>
        </Section>

        <Section title="Segmented control">
          <SegmentedControl
            accessibilityLabel="Schedule"
            options={[
              { value: 'exams', label: 'Εξεταστική' },
              { value: 'classes', label: 'Μαθήματα' },
            ]}
            value={segment}
            onChange={setSegment}
          />
        </Section>

        <Section title="Search field">
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Αναζήτηση τμήματος"
            clearLabel="Clear"
          />
        </Section>

        <Section title="Card">
          <Card>
            <View style={styles.stack}>
              <Text variant="overline" color="primary">
                ΑΥΡΙΟ · 09:00
              </Text>
              <Text variant="heading">Αλγόριθμοι και Πολυπλοκότητα</Text>
              <Text variant="callout" color="textMuted">
                Αίθουσα Α2 · 5ο εξάμηνο
              </Text>
            </View>
          </Card>
          <Card onPress={() => {}} accessibilityLabel="Pressable card">
            <Text variant="subheading">Κάρτα που πατιέται</Text>
            <Text variant="callout" color="textMuted">
              Βυθίζεται ελαφρά κάτω από το δάχτυλο.
            </Text>
          </Card>
        </Section>

        <Section title="List rows">
          <Card padded={false}>
            <ListRow
              icon="department"
              title="Πληροφορικής"
              subtitle="Σχολή Θετικών Επιστημών · Καστοριά"
              trailing="chevron"
              onPress={() => {}}
            />
            <Divider inset={68} />
            <ListRow icon="language" title="Γλώσσα" value="Ελληνικά" onPress={() => {}} />
            <Divider inset={68} />
            <ListRow icon="about" title="Έκδοση" value="0.1.0" />
          </Card>
          <Card padded={false}>
            {['cs', 'math'].map((id, index) => (
              <View key={id}>
                {index > 0 ? <Divider inset={16} /> : null}
                <ListRow
                  title={id === 'cs' ? 'Πληροφορικής' : 'Μαθηματικών'}
                  subtitle="Καστοριά"
                  trailing="check"
                  selected={checked === id}
                  accessibilityRole="radio"
                  onPress={() => setChecked(id)}
                />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Skeletons">
          <SkeletonGroup accessibilityLabel="Loading">
            <View style={styles.stack}>
              <Card padded={false}>
                <ListRowSkeleton />
                <Divider inset={68} />
                <ListRowSkeleton />
              </Card>
              <CardSkeleton />
            </View>
          </SkeletonGroup>
        </Section>

        <Section title="Offline notice">
          <OfflineNotice title="Εκτός σύνδεσης" detail="Τελευταία ενημέρωση 12:40" />
        </Section>

        <Section title="States">
          <Card padded={false} style={styles.state}>
            <StateView
              kind="empty"
              icon="announcements"
              title="Καμία ανακοίνωση ακόμα"
              message="Οι ανακοινώσεις του τμήματός σου θα εμφανίζονται εδώ."
            />
          </Card>
          <Card padded={false} style={styles.state}>
            <StateView
              kind="offline"
              title="Είσαι εκτός σύνδεσης"
              message="Συνδέσου στο διαδίκτυο για να φορτώσει το περιεχόμενο."
              action={{ label: 'Δοκίμασε ξανά', onPress: () => {} }}
            />
          </Card>
          <Card padded={false} style={styles.state}>
            <StateView
              kind="error"
              title="Κάτι πήγε στραβά"
              message="Το περιεχόμενο δεν φορτώθηκε. Δεν φταις εσύ."
              action={{ label: 'Δοκίμασε ξανά', onPress: () => {} }}
            />
          </Card>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingBottom: theme.spacing[10],
  },
  section: {
    paddingHorizontal: theme.spacing[4],
    gap: theme.spacing[3],
  },
  stack: {
    gap: theme.spacing[3],
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  swatch: {
    width: 76,
    gap: theme.spacing[1],
  },
  swatchColour: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  state: {
    height: 320,
  },
}));
