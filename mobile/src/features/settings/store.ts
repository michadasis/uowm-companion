import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ThemePreference } from '@/design';
import i18n from '@/i18n';

export type Language = 'el' | 'en';

interface Settings {
  /** Null until the student has picked a department, which is onboarding. */
  departmentId: string | null;
  language: Language;
  theme: ThemePreference;
}

interface SettingsActions {
  setDepartment: (departmentId: string) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
}

export const defaultSettings: Settings = {
  departmentId: null,
  language: 'el',
  theme: 'system',
};

/**
 * The few choices the app remembers on the device. Everything fetched from
 * the backend lives in the query cache instead; this store only holds what
 * the student decided.
 */
export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setDepartment: (departmentId) => set({ departmentId }),
      setLanguage: (language) => {
        // The translations ship with the app, so this takes effect at once
        // and every screen re-renders in the new language.
        void i18n.changeLanguage(language);
        set({ language });
      },
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ departmentId, language, theme }): Settings => ({
        departmentId,
        language,
        theme,
      }),
      // Applied before hydration is reported as finished, so the first frame
      // is already in the saved language.
      onRehydrateStorage: () => (saved) => {
        if (saved) void i18n.changeLanguage(saved.language);
      },
    },
  ),
);

/**
 * False until the saved settings have been read from storage. Rendering
 * before that would flash onboarding at a student who has already chosen.
 */
export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSettings.persist.onFinishHydration(onChange),
    () => useSettings.persist.hasHydrated(),
    () => false,
  );
}
