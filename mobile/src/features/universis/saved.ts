import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StudentCourse } from './types';

interface SavedCourses {
  /** The student's courses as last read from Universis; null before any read. */
  courses: StudentCourse[] | null;
  /** When they were read, in epoch milliseconds. */
  updatedAt: number | null;
  /** The student's given name, as Universis keeps it, to greet them by. */
  givenName: string | null;
  /** As Universis records it, for "Φοιτητής" or "Φοιτήτρια". */
  gender: 'male' | 'female' | null;
  /** The app's department Universis places the student in, while linked. */
  departmentId: string | null;
  save: (courses: StudentCourse[]) => void;
  /** Keeps what a profile read found; what it didn't find stays as it was. */
  saveProfile: (profile: {
    givenName?: string;
    gender?: 'male' | 'female';
    departmentId?: string;
  }) => void;
  clear: () => void;
}

/**
 * The last course list read from Universis, kept on the device. A Universis
 * token only lasts a short while, but what a student has declared & passed
 * changes a few times a year — so the schedule keeps narrowing to their courses
 * from this copy long after the token is gone, & signing in again just
 * refreshes it. Grades are kept too, so the grades screen opens without a
 * fresh sign-in; the copy stays on this device & goes when the student
 * disconnects.
 */
export const useSavedCourses = create<SavedCourses>()(
  persist(
    (set) => ({
      courses: null,
      updatedAt: null,
      givenName: null,
      gender: null,
      departmentId: null,
      save: (courses) => set({ courses, updatedAt: Date.now() }),
      saveProfile: ({ givenName, gender, departmentId }) =>
        set((state) => ({
          givenName: givenName ?? state.givenName,
          gender: gender ?? state.gender,
          departmentId: departmentId ?? state.departmentId,
        })),
      clear: () =>
        set({ courses: null, updatedAt: null, givenName: null, gender: null, departmentId: null }),
    }),
    {
      name: 'universis-courses',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ courses, updatedAt, givenName, gender, departmentId }) => ({
        courses,
        updatedAt,
        givenName,
        gender,
        departmentId,
      }),
    },
  ),
);
