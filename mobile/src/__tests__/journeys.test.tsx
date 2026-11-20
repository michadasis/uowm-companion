import AsyncStorage from '@react-native-async-storage/async-storage';
import { screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { defaultSettings, useSettings } from '@/features/settings/store';
import { useUniversisAuth } from '@/features/universis/auth';
import { useSavedCourses } from '@/features/universis/saved';
import i18n from '@/i18n';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hide: jest.fn(),
}));

// The sign-in page is the University's own, in a native WebView.
jest.mock('react-native-webview', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { WebView: () => <View testID="universis-webview" /> };
});

// Each test boots the whole app, which takes longer than Jest's five
// seconds on a busy CI runner.
jest.setTimeout(30_000);

// These tests run the real route files, so they cover what unit tests of a
// single screen cannot: which screen a student lands on, and that choosing a
// department is what moves them from onboarding into the app.
async function launch() {
  const router = await renderRouter('src/app');
  return { router, user: userEvent.setup() };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettings.setState(defaultSettings);
  await i18n.changeLanguage(defaultSettings.language);
});

describe('first launch', () => {
  it('takes a new student from the welcome screen to their department', async () => {
    const { router, user } = await launch();

    expect(await screen.findByTestId('welcome-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/welcome');

    await user.press(screen.getByRole('button', { name: 'Ξεκίνα' }));
    expect(await screen.findByTestId('onboarding-department-screen')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Συνέχεια' })).toBeDisabled();

    await user.type(screen.getByLabelText('Αναζήτηση τμήματος'), 'pliroforiki');
    await user.press(await screen.findByTestId('department-cs'));
    // Nothing is saved until the choice is confirmed.
    expect(useSettings.getState().departmentId).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Συνέχεια' }));

    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/');
    expect(useSettings.getState().departmentId).toBe('cs');
    expect(screen.getByTestId('home-today')).toHaveTextContent(/Πληροφορικής/);
  });

  it('offers to find the department from Universis before the list', async () => {
    const { router, user } = await launch();
    await user.press(await screen.findByRole('button', { name: 'Ξεκίνα' }));
    await user.press(await screen.findByTestId('department-from-universis'));

    expect(await screen.findByTestId('universis-login')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/universis-login');
  });

  it('switches the whole app to English from the welcome screen', async () => {
    const { user } = await launch();
    await screen.findByTestId('welcome-screen');

    await user.press(screen.getByRole('radio', { name: 'English' }));

    expect(await screen.findByRole('button', { name: 'Get started' })).toBeOnTheScreen();
    expect(useSettings.getState().language).toBe('en');
  });
});

describe('a returning student', () => {
  beforeEach(() => {
    useSettings.setState({ departmentId: 'mech' });
  });

  it('opens on the home screen of their department', async () => {
    const { router } = await launch();

    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/');
    expect(screen.getByTestId('home-today')).toHaveTextContent(/Μηχανολόγων Μηχανικών/);
  });

  it('cannot be sent back into onboarding by a link', async () => {
    const router = await renderRouter('src/app', { initialUrl: '/welcome' });

    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/');
  });

  it('reaches every tab from the tab bar', async () => {
    const { user } = await launch();
    await screen.findByTestId('home-screen');

    await user.press(screen.getByRole('tab', { name: 'Νέα' }));
    expect(await screen.findByTestId('announcements-screen')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Πρόγραμμα' }));
    expect(await screen.findByTestId('schedule-screen')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Λέσχη' }));
    expect(await screen.findByTestId('menu-screen')).toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));
    expect(await screen.findByTestId('more-screen')).toBeOnTheScreen();
  });

  it('changes department from the More tab', async () => {
    const { router, user } = await launch();
    await screen.findByTestId('home-screen');

    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));
    await user.press(await screen.findByTestId('more-department'));
    expect(await screen.findByTestId('settings-department-screen')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Αναζήτηση τμήματος'), 'μαθηματικών');
    await user.press(await screen.findByTestId('department-math'));

    expect(useSettings.getState().departmentId).toBe('math');
    expect(await screen.findByTestId('more-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/more');
    expect(screen.getByTestId('more-department')).toHaveTextContent(/Μαθηματικών/);
  });

  it('changes department while linked to Universis, without crashing', async () => {
    useUniversisAuth.setState({ token: 'tok' });
    useSavedCourses.setState({
      courses: [{ name: 'Φυσική', passed: true, registered: true, semester: 1, grade: 8 }],
      updatedAt: Date.now(),
      givenName: 'ΙΩΑΝΝΗΣ',
      gender: 'male',
    });
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const { router, user } = await launch();
    await screen.findByTestId('home-screen');

    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));
    await user.press(await screen.findByTestId('more-department'));
    await user.type(screen.getByLabelText('Αναζήτηση τμήματος'), 'μαθηματικών');
    await user.press(await screen.findByTestId('department-math'));

    expect(await screen.findByTestId('more-screen')).toBeOnTheScreen();
    await user.press(screen.getByRole('tab', { name: 'Πρόγραμμα' }));
    expect(await screen.findByTestId('schedule-screen')).toBeOnTheScreen();
    await user.press(screen.getByRole('tab', { name: 'Αρχική' }));
    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/');
    fetchMock.mockRestore();
    useUniversisAuth.setState({ token: null });
    useSavedCourses.setState({ courses: null, updatedAt: null, givenName: null, gender: null });
  });

  it('changes theme and language from the More tab', async () => {
    const { user } = await launch();
    await screen.findByTestId('home-screen');
    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));
    await screen.findByTestId('more-screen');

    await user.press(screen.getByRole('radio', { name: 'Σκούρο' }));
    expect(useSettings.getState().theme).toBe('dark');

    await user.press(screen.getByRole('radio', { name: 'English' }));
    expect(await screen.findByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('tab', { name: 'More' })).toBeSelected();
  });
});
