import { render, screen, userEvent } from '@testing-library/react-native';

import i18n from '@/i18n';

import { DepartmentPicker } from '../DepartmentPicker';
import { bundledDirectory } from '../useDirectory';

async function renderPicker(selectedId: string | null = null) {
  const onSelect = jest.fn();
  await render(
    <DepartmentPicker directory={bundledDirectory} selectedId={selectedId} onSelect={onSelect} />,
  );
  return { onSelect, user: userEvent.setup() };
}

afterEach(async () => {
  await i18n.changeLanguage('el');
});

describe('DepartmentPicker', () => {
  it('lists departments under their school, with the city on each row', async () => {
    await renderPicker();

    expect(screen.getByRole('header', { name: 'Πολυτεχνική Σχολή' })).toBeOnTheScreen();
    expect(screen.getByTestId('department-ece')).toHaveTextContent(
      'Ηλεκτρολόγων Μηχανικών και Μηχανικών ΥπολογιστώνΚοζάνη',
    );
  });

  it('narrows the list as the student types', async () => {
    const { user } = await renderPicker();

    await user.type(screen.getByLabelText('Αναζήτηση τμήματος'), 'πληροφορ');

    expect(screen.getByTestId('department-cs')).toBeOnTheScreen();
    expect(screen.queryByTestId('department-ece')).not.toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Σχολή Θετικών Επιστημών' })).toBeOnTheScreen();
  });

  it('filters by city, and shows every city again when the chip is pressed twice', async () => {
    const { user } = await renderPicker();

    await user.press(screen.getByRole('button', { name: 'Γρεβενά' }));

    expect(screen.getByTestId('department-ba')).toBeOnTheScreen();
    expect(screen.getByTestId('department-stat')).toBeOnTheScreen();
    expect(screen.queryByTestId('department-ece')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Γρεβενά' })).toBeSelected();

    await user.press(screen.getByRole('button', { name: 'Γρεβενά' }));

    expect(screen.getByTestId('department-ece')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Όλες' })).toBeSelected();
  });

  it('reports the department that is tapped and marks the chosen one', async () => {
    const { onSelect, user } = await renderPicker('mech');

    expect(screen.getByTestId('department-mech')).toBeChecked();
    expect(screen.getByTestId('department-ece')).not.toBeChecked();

    await user.press(screen.getByTestId('department-ece'));

    expect(onSelect).toHaveBeenCalledWith('ece');
  });

  it('explains an empty result and offers to clear the filters', async () => {
    const { user } = await renderPicker();

    await user.type(screen.getByLabelText('Αναζήτηση τμήματος'), 'αστροφυσική');

    expect(screen.getByRole('header', { name: 'Δεν βρέθηκε τμήμα' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Καθαρισμός φίλτρων' }));

    expect(screen.getByTestId('department-ece')).toBeOnTheScreen();
  });

  it('shows English names when the app is in English', async () => {
    await i18n.changeLanguage('en');
    await renderPicker();

    expect(screen.getByRole('header', { name: 'School of Engineering' })).toBeOnTheScreen();
    expect(screen.getByTestId('department-ece')).toHaveTextContent(
      'Electrical and Computer EngineeringKozani',
    );
  });
});
