import { render, screen, userEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  ListRow,
  ListRowSkeleton,
  NavBar,
  OfflineNotice,
  ScreenTitle,
  SearchField,
  SectionHeader,
  SegmentedControl,
  SkeletonGroup,
  StateView,
  Text,
  ThemeProvider,
  themes,
} from '@/design';
import { resolveScheme } from '@/design/ThemeProvider';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Text', () => {
  it('applies the type style and colour of its variant', async () => {
    await render(
      <Text variant="title" color="textMuted">
        Ανακοινώσεις
      </Text>,
    );

    expect(screen.getByText('Ανακοινώσεις')).toHaveStyle({
      fontFamily: 'Commissioner_700Bold',
      fontSize: 24,
      color: themes.light.colors.textMuted,
    });
  });

  it('limits how far the system font size can scale chrome', async () => {
    await render(<Text variant="tab">Αρχική</Text>);

    expect(screen.getByText('Αρχική')).toHaveProp('maxFontSizeMultiplier', 1.2);
  });

  it('takes its colours from the dark theme when that is chosen', async () => {
    await render(
      <ThemeProvider preference="dark">
        <Text>Καλησπέρα</Text>
      </ThemeProvider>,
    );

    expect(screen.getByText('Καλησπέρα')).toHaveStyle({ color: themes.dark.colors.text });
  });
});

describe('resolveScheme', () => {
  it('follows the device only when asked to', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });
});

describe('Button', () => {
  it('runs its action when pressed', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button label="Συνέχεια" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Συνέχεια' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while disabled', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button label="Συνέχεια" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Συνέχεια' });
    await user.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is busy and ignores presses while loading', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button label="Συνέχεια" onPress={onPress} loading />);

    const button = screen.getByRole('button', { name: 'Συνέχεια' });
    await user.press(button);

    expect(button).toBeBusy();
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('is a plain container by default and a button when given an action', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <View>
        <Card>
          <Text>Στατική</Text>
        </Card>
        <Card onPress={onPress} accessibilityLabel="Άνοιγμα">
          <Text>Πατιέται</Text>
        </Card>
      </View>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.press(screen.getByRole('button', { name: 'Άνοιγμα' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Chip', () => {
  it('reports whether it is selected and toggles on press', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <View>
        <Chip label="Καστοριά" selected onPress={onPress} />
        <Chip label="Κοζάνη" onPress={onPress} />
      </View>,
    );

    expect(screen.getByRole('button', { name: 'Καστοριά' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Κοζάνη' })).not.toBeSelected();

    await user.press(screen.getByRole('button', { name: 'Κοζάνη' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'exams', label: 'Εξεταστική' },
    { value: 'classes', label: 'Μαθήματα' },
  ] as const;

  it('presents its options as a radio group with one checked', async () => {
    await render(
      <SegmentedControl
        accessibilityLabel="Πρόγραμμα"
        options={options}
        value="exams"
        onChange={() => {}}
      />,
    );

    // The group itself is not a focus stop, or a screen reader could not
    // reach the options inside it; it only names them.
    expect(screen.getByLabelText('Πρόγραμμα')).toHaveProp('accessibilityRole', 'radiogroup');
    expect(screen.getByRole('radio', { name: 'Εξεταστική' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Μαθήματα' })).not.toBeChecked();
  });

  it('changes value with a haptic tick when another option is pressed', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <SegmentedControl
        accessibilityLabel="Πρόγραμμα"
        options={options}
        value="exams"
        onChange={onChange}
      />,
    );

    await user.press(screen.getByRole('radio', { name: 'Μαθήματα' }));

    expect(onChange).toHaveBeenCalledWith('classes');
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the chosen option is pressed again', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <SegmentedControl
        accessibilityLabel="Πρόγραμμα"
        options={options}
        value="exams"
        onChange={onChange}
      />,
    );

    await user.press(screen.getByRole('radio', { name: 'Εξεταστική' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});

describe('ListRow', () => {
  it('shows its title, subtitle and value', async () => {
    await render(<ListRow title="Γλώσσα" subtitle="Της εφαρμογής" value="Ελληνικά" />);

    expect(screen.getByText('Γλώσσα')).toBeOnTheScreen();
    expect(screen.getByText('Της εφαρμογής')).toBeOnTheScreen();
    expect(screen.getByText('Ελληνικά')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('is pressable and reports its selection when it is a choice', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <View>
        <ListRow
          title="Πληροφορικής"
          trailing="check"
          selected
          accessibilityRole="radio"
          onPress={onPress}
        />
        <ListRow
          title="Μαθηματικών"
          trailing="check"
          selected={false}
          accessibilityRole="radio"
          onPress={onPress}
        />
      </View>,
    );

    const [informatics, mathematics] = screen.getAllByRole('radio');
    expect(informatics).toBeChecked();
    expect(mathematics).not.toBeChecked();

    await user.press(mathematics!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SearchField', () => {
  it('reports what is typed', async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await render(
      <SearchField
        value=""
        onChangeText={onChangeText}
        placeholder="Αναζήτηση τμήματος"
        clearLabel="Καθαρισμός"
      />,
    );

    await user.type(screen.getByLabelText('Αναζήτηση τμήματος'), 'πλ');

    expect(onChangeText).toHaveBeenLastCalledWith('λ');
    expect(screen.queryByRole('button', { name: 'Καθαρισμός' })).not.toBeOnTheScreen();
  });

  it('offers to clear the field once it has text', async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await render(
      <SearchField
        value="πληροφ"
        onChangeText={onChangeText}
        placeholder="Αναζήτηση τμήματος"
        clearLabel="Καθαρισμός"
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Καθαρισμός' }));

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

describe('SectionHeader', () => {
  it('keeps Greek in sentence case, accents & all, as a header with its detail', async () => {
    await render(<SectionHeader title="Σχολή Θετικών Επιστημών" detail="2" />);

    expect(screen.getByRole('header', { name: 'Σχολή Θετικών Επιστημών' })).toHaveTextContent(
      'Σχολή Θετικών Επιστημών',
    );
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('offers an action in place of the detail', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <SectionHeader title="Ανακοινώσεις" detail="3" action={{ label: 'Όλες', onPress }} />,
    );

    expect(screen.queryByText('3')).not.toBeOnTheScreen();
    await user.press(screen.getByRole('link', { name: 'Όλες' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ScreenTitle and NavBar', () => {
  it('mark their titles as headers', async () => {
    const onBack = jest.fn();
    const user = userEvent.setup();
    await render(
      <View>
        <NavBar title="Το τμήμα μου" onBack={onBack} backLabel="Πίσω" />
        <ScreenTitle title="Περισσότερα" subtitle="Ρυθμίσεις" />
      </View>,
    );

    expect(screen.getByRole('header', { name: 'Το τμήμα μου' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Περισσότερα' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Πίσω' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('StateView', () => {
  it('explains an empty screen without offering an action', async () => {
    await render(
      <StateView kind="empty" title="Καμία ανακοίνωση ακόμα" message="Θα εμφανίζονται εδώ." />,
    );

    expect(screen.getByRole('header', { name: 'Καμία ανακοίνωση ακόμα' })).toBeOnTheScreen();
    expect(screen.getByText('Θα εμφανίζονται εδώ.')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it.each(['offline', 'error'] as const)('offers a retry in the %s state', async (kind) => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <StateView kind={kind} title="Τίτλος" action={{ label: 'Δοκίμασε ξανά', onPress }} />,
    );

    await user.press(screen.getByRole('button', { name: 'Δοκίμασε ξανά' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('OfflineNotice', () => {
  it('says how old the content underneath is', async () => {
    await render(<OfflineNotice title="Εκτός σύνδεσης" detail="Τελευταία ενημέρωση 12:40" />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Εκτός σύνδεσης · Τελευταία ενημέρωση 12:40',
    );
  });
});

describe('SkeletonGroup', () => {
  it('is announced as one busy area instead of a pile of placeholders', async () => {
    await render(
      <SkeletonGroup accessibilityLabel="Φόρτωση">
        <ListRowSkeleton />
        <ListRowSkeleton />
      </SkeletonGroup>,
    );

    expect(screen.getByRole('progressbar', { name: 'Φόρτωση' })).toBeBusy();
  });
});
