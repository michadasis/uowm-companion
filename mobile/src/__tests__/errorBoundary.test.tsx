import AsyncStorage from '@react-native-async-storage/async-storage';
import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { defaultSettings, useSettings } from '@/features/settings/store';
import { useUniversisAuth } from '@/features/universis/auth';
import { useSavedCourses } from '@/features/universis/saved';
import i18n from '@/i18n';
import { queryClient } from '@/lib/query';

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hide: jest.fn(),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Stands in for a section that falls over on the student's saved courses, as
// a crash on every launch does once Universis is linked, or on anything at all.
let mockFallsOver: 'with courses' | 'always' = 'with courses';
jest.mock('@/features/home/GradesSection', () => {
  const { useSavedCourses: saved } = jest.requireActual<
    typeof import('@/features/universis/saved')
  >('@/features/universis/saved');
  return {
    GradesSection: () => {
      const courses = saved((s) => s.courses);
      if (mockFallsOver === 'always' || courses) throw new Error('Grades fell over');
      return null;
    },
  };
});

const jwt = (exp: number) => `h.${btoa(JSON.stringify({ exp })).replace(/=+$/, '')}.s`;

beforeEach(async () => {
  await AsyncStorage.clear();
  queryClient.clear();
  useSettings.setState({ ...defaultSettings, departmentId: 'cs' });
  await i18n.changeLanguage(defaultSettings.language);
  // React reports every error a boundary catches.
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  jest.restoreAllMocks();
  mockFallsOver = 'with courses';
  await useUniversisAuth.getState().signOut();
  useSavedCourses.getState().clear();
});

it('shows the error in place of the app, & signing out of Universis gets back in', async () => {
  await useUniversisAuth.getState().signIn(jwt(Math.floor(Date.now() / 1000) + 3600));
  useSavedCourses.getState().save([{ name: 'Φυσική', passed: true, grade: 7 }]);
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
  await renderRouter('src/app');
  const user = userEvent.setup();

  expect(await screen.findByTestId('app-error')).toBeOnTheScreen();
  expect(screen.getByText(/Error: Grades fell over/)).toBeOnTheScreen();

  // The same saved courses fall over again.
  await user.press(screen.getByRole('button', { name: 'Δοκίμασε ξανά' }));
  expect(await screen.findByTestId('app-error')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Αποσύνδεση από το Universis' }));
  expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
  await waitFor(() => expect(useUniversisAuth.getState().token).toBeNull());
  expect(useSavedCourses.getState().courses).toBeNull();
});

it('offers no Universis way out to a student who never linked it', async () => {
  mockFallsOver = 'always';
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
  await renderRouter('src/app');

  expect(await screen.findByTestId('app-error')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Δοκίμασε ξανά' })).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: 'Αποσύνδεση από το Universis' }),
  ).not.toBeOnTheScreen();
});
