import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { defaultSettings, useSettings } from '@/features/settings/store';
import { useUniversisAuth } from '@/features/universis/auth';
import { useSavedCourses } from '@/features/universis/saved';
import i18n from '@/i18n';
import { queryClient } from '@/lib/query';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hide: jest.fn(),
}));

// The sign-in page is the University's own, in a native WebView.
// It hands the page's messages to the test, as the hook inside it would.
let sendFromPage: ((data: string) => void) | undefined;
jest.mock('react-native-webview', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    WebView: ({ onMessage }: { onMessage: (event: { nativeEvent: { data: string } }) => void }) => {
      sendFromPage = (data) => onMessage({ nativeEvent: { data } });
      return <View testID="universis-webview" />;
    },
  };
});

/** A sign-in token as Universis issues one, running out at `exp` (seconds). */
const jwt = (exp: number, id: string) =>
  `h.${btoa(JSON.stringify({ exp, sub: id })).replace(/=+$/, '')}.s`;
const tokenMessage = (token: string) => JSON.stringify({ type: 'universis-token', token });

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

  it('finds the department from Universis, past a stale token & one it turns down', async () => {
    const inAnHour = Math.floor(Date.now() / 1000) + 3600;
    const refused = jwt(inAnHour, 'refused');
    // Universis as it answers: the profile only at its real address, a 404
    // anywhere else, & a 401 for a token it turns down.
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization ?? '';
      if (auth.includes(refused)) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) } as Response);
      }
      if (!String(input).startsWith('https://api1.uowm.gr/api/students/me?')) {
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          person: { givenName: 'ΙΩΑΝΝΗΣ', gender: { alternateName: 'male' } },
          department: { id: '1554', name: 'ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ', abbreviation: 'cs' },
        }),
      } as Response);
    });
    const { router, user } = await launch();
    await user.press(await screen.findByRole('button', { name: 'Ξεκίνα' }));
    await user.press(await screen.findByTestId('department-from-universis'));
    await screen.findByTestId('universis-webview');

    // A token left from an earlier session, long expired: not a sign-in.
    await act(async () => sendFromPage!(tokenMessage(jwt(1_000, 'old'))));
    // One Universis turns down: wait for the next.
    await act(async () => sendFromPage!(tokenMessage(refused)));
    expect(router.getPathname()).toBe('/universis-login');
    expect(useSettings.getState().departmentId).toBeNull();
    // The student's own sign-in.
    await act(async () => sendFromPage!(tokenMessage(jwt(inAnHour, 'live'))));

    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
    expect(useSettings.getState().departmentId).toBe('cs');
    expect(useSavedCourses.getState().givenName).toBe('ΙΩΑΝΝΗΣ');
    fetchMock.mockRestore();
    useUniversisAuth.setState({ token: null });
    useSavedCourses.setState({
      courses: null,
      updatedAt: null,
      givenName: null,
      gender: null,
      departmentId: null,
    });
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

describe('a student Universis no longer counts as studying', () => {
  const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

  // Universis for an erased student: the sign-in still works & the courses &
  // the last declaration are still there, with a status that says they left.
  const erased = () =>
    jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input);
      const body = url.includes('/registrations')
        ? {
            value: [
              {
                registrationYear: { id: 2023 },
                registrationPeriod: { id: 2 },
                classes: [{ course: { name: 'ΓΕΝΙΚΗ ΛΟΓΙΣΤΙΚΗ' }, isPassed: 0 }],
              },
            ],
          }
        : url.includes('/courses')
          ? { value: [{ course: { name: 'ΓΕΝΙΚΗ ΛΟΓΙΣΤΙΚΗ' }, isPassed: 0, grade: 0.3 }] }
          : {
              person: { givenName: 'ΙΩΑΝΝΗΣ' },
              department: { id: '1548', name: 'ΤΜΗΜΑ ΟΙΚΟΝΟΜΙΚΩΝ ΕΠΙΣΤΗΜΩΝ', abbreviation: 'econ' },
              studentStatus: { id: 3, alternateName: 'erased', name: 'Διαγραμμένος' },
            };
      return Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);
    });

  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await useUniversisAuth.getState().signOut();
    useSavedCourses.setState({
      courses: null,
      updatedAt: null,
      givenName: null,
      gender: null,
      departmentId: null,
    });
  });

  it('signs in without taking anything from Universis or changing the department', async () => {
    useSettings.setState({ departmentId: 'cs' });
    erased();
    const { router, user } = await launch();
    await screen.findByTestId('home-screen');
    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));
    await user.press(await screen.findByTestId('more-universis-connect'));
    await screen.findByTestId('universis-webview');

    await act(async () => sendFromPage!(tokenMessage(jwt(inAnHour(), 'erased'))));

    const notice = await screen.findByTestId('universis-inactive');
    expect(useUniversisAuth.getState().token).toBeNull();
    expect(useSavedCourses.getState().courses).toBeNull();
    expect(useSettings.getState().departmentId).toBe('cs');

    await user.press(within(notice).getByRole('button', { name: 'Πίσω' }));
    expect(await screen.findByTestId('more-screen')).toBeOnTheScreen();
    expect(router.getPathname()).toBe('/more');
    expect(screen.getByTestId('more-universis-connect')).toBeOnTheScreen();
  });

  it('on a first launch, leaves the department to the list', async () => {
    erased();
    const { user } = await launch();
    await user.press(await screen.findByRole('button', { name: 'Ξεκίνα' }));
    await user.press(await screen.findByTestId('department-from-universis'));
    await screen.findByTestId('universis-webview');

    await act(async () => sendFromPage!(tokenMessage(jwt(inAnHour(), 'erased'))));

    const notice = await screen.findByTestId('universis-inactive');
    expect(useSettings.getState().departmentId).toBeNull();
    expect(useUniversisAuth.getState().token).toBeNull();

    await user.press(within(notice).getByRole('button', { name: 'Πίσω' }));
    expect(await screen.findByTestId('onboarding-department-screen')).toBeOnTheScreen();
  });

  it('lets go of a link Universis stops counting, keeping the department', async () => {
    useSettings.setState({ departmentId: 'cs', courseFilter: 'registered' });
    // Kept in the keychain, as a real sign-in leaves it, so launch reads it back.
    await useUniversisAuth.getState().signIn(jwt(inAnHour(), 'was-studying'));
    useSavedCourses.setState({
      courses: [{ name: 'Φυσική', passed: false, registered: true, semester: 1, grade: 3 }],
      updatedAt: Date.now(),
      givenName: 'ΙΩΑΝΝΗΣ',
      gender: 'male',
      departmentId: 'cs',
    });
    erased();
    await launch();
    await screen.findByTestId('home-screen');

    await waitFor(() => {
      expect(useUniversisAuth.getState().token).toBeNull();
      expect(useSavedCourses.getState().courses).toBeNull();
    });
    expect(useSettings.getState().departmentId).toBe('cs');
    expect(screen.queryByTestId('home-grades')).not.toBeOnTheScreen();
  });
});
