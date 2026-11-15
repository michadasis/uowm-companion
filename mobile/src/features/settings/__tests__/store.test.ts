import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import i18n from '@/i18n';

import { defaultSettings, useSettings, useSettingsHydrated } from '../store';

async function saved(): Promise<unknown> {
  const raw = await AsyncStorage.getItem('settings');
  return raw === null ? null : JSON.parse(raw);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettings.setState(defaultSettings);
  await i18n.changeLanguage(defaultSettings.language);
});

describe('settings', () => {
  it('starts in Greek, following the device theme, with no department', () => {
    expect(useSettings.getState()).toMatchObject({
      departmentId: null,
      language: 'el',
      theme: 'system',
    });
  });

  it('saves each choice to the device', async () => {
    useSettings.getState().setDepartment('cs');
    useSettings.getState().setLanguage('en');
    useSettings.getState().setTheme('dark');

    expect(await saved()).toEqual({
      state: { departmentId: 'cs', semester: null, courseFilter: 'all', language: 'en', theme: 'dark' },
      version: 1,
    });
  });

  it('remembers the semester but forgets it when the department changes', () => {
    useSettings.getState().setDepartment('cs');
    useSettings.getState().setSemester('Γ΄');
    expect(useSettings.getState().semester).toBe('Γ΄');

    useSettings.getState().setDepartment('mech');
    expect(useSettings.getState().semester).toBeNull();
  });

  it('restores saved choices on the next launch', async () => {
    await AsyncStorage.setItem(
      'settings',
      JSON.stringify({
        state: { departmentId: 'mech', language: 'en', theme: 'light' },
        version: 1,
      }),
    );

    await useSettings.persist.rehydrate();

    expect(useSettings.getState()).toMatchObject({
      departmentId: 'mech',
      language: 'en',
      theme: 'light',
    });
  });

  it('switches the translations as soon as the language changes', () => {
    useSettings.getState().setLanguage('en');

    expect(i18n.language).toBe('en');
    expect(i18n.t('tabs.home')).toBe('Home');
  });

  it('starts in the saved language', async () => {
    await AsyncStorage.setItem(
      'settings',
      JSON.stringify({ state: { ...defaultSettings, language: 'en' }, version: 1 }),
    );

    await useSettings.persist.rehydrate();

    expect(i18n.language).toBe('en');
  });

  it('reports when the saved choices have been read', async () => {
    const { result } = await renderHook(() => useSettingsHydrated());

    await act(async () => {
      await useSettings.persist.rehydrate();
    });

    expect(result.current).toBe(true);
  });
});
