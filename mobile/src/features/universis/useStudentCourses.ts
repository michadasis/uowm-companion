import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { bundledDirectory } from '@/features/departments/useDirectory';
import { useSettings } from '@/features/settings/store';
import { queryClient } from '@/lib/query';

import { givenNameFromToken, isTokenExpired, useUniversisAuth } from './auth';
import { fetchStudentProfile, loadStudentCourses, UniversisError } from './client';
import type { StudentProfile } from './client';
import { matchDepartment } from './department';
import { useSavedCourses } from './saved';
import type { StudentCourse } from './types';

/**
 * Keeps what Universis says of the student: the name to greet them by, as the
 * token states it or the profile does; whether "Φοιτητής" or "Φοιτήτρια"; &
 * their department, which then is theirs in the app — not picked by hand.
 * Returns the department found, if one was.
 */
export function applyProfile(token: string, profile: StudentProfile): string | null {
  const departmentId = profile.departmentNames
    ? matchDepartment(bundledDirectory, profile.departmentNames)
    : null;
  useSavedCourses.getState().saveProfile({
    givenName: givenNameFromToken(token),
    ...(profile.givenName ? { givenName: profile.givenName } : {}),
    ...(profile.gender ? { gender: profile.gender } : {}),
    ...(departmentId ? { departmentId } : {}),
  });
  const settings = useSettings.getState();
  if (departmentId && settings.departmentId !== departmentId) settings.setDepartment(departmentId);
  return departmentId;
}

// The token is deliberately not part of the key: keys are written out with the
// saved query cache, & a token belongs in the keychain alone.
const coursesKey = ['universis', 'courses'] as const;

export interface StudentCoursesState {
  /**
   * The courses to narrow the schedule by: fresh from Universis when just
   * read, the saved copy otherwise. Undefined until there has been one read.
   */
  courses: StudentCourse[] | undefined;
  /** True while a live token is held, so the list can be refreshed. */
  connected: boolean;
  /**
   * The courses shown are the saved copy & the token behind them has run out:
   * a newer grade or declaration may be missing until the student signs in.
   */
  expired: boolean;
  /** When the courses shown were read, in epoch milliseconds. */
  updatedAt: number | null;
  /** A read is under way, e.g. after a pull to refresh. */
  isRefreshing: boolean;
  /** Reading for the first time, with no saved copy to show meanwhile. */
  isLoading: boolean;
  /** The read failed & there is no saved copy to fall back on. */
  isError: boolean;
  refetch: () => void;
}

/**
 * The student's courses from Universis. Reads them while a token is held &
 * saves each good read; once the token expires the saved copy carries on, so
 * the schedule stays personal without signing in every hour.
 */
export function useStudentCourses(): StudentCoursesState {
  const token = useUniversisAuth((s) => s.token);
  const saved = useSavedCourses((s) => s.courses);
  const savedAt = useSavedCourses((s) => s.updatedAt);
  // A token past its expiry is let go of before it is ever sent.
  const live = token !== null && !isTokenExpired(token);
  useEffect(() => {
    if (token !== null && !live) void useUniversisAuth.getState().signOut();
  }, [token, live]);

  // The name to greet the student by, read on its own when the courses came
  // from the saved copy & never brought it — as after an update.
  const givenName = useSavedCourses((s) => s.givenName);
  const universisDepartment = useSavedCourses((s) => s.departmentId);
  useQuery({
    queryKey: ['universis', 'profile'],
    queryFn: async ({ signal }) => {
      const profile = await fetchStudentProfile(token!, { signal });
      applyProfile(token!, profile);
      return profile;
    },
    enabled: live && (givenName === null || universisDepartment === null),
    staleTime: Infinity,
    retry: 1,
  });

  const query = useQuery({
    queryKey: coursesKey,
    queryFn: async ({ signal }) => {
      const [courses, profile] = await Promise.all([
        loadStudentCourses(token!, { signal }),
        // The profile is a nicety: a failure to read it leaves the courses be.
        fetchStudentProfile(token!, { signal }).catch(() => ({})),
      ]);
      useSavedCourses.getState().save(courses);
      applyProfile(token!, profile);
      return courses;
    },
    enabled: live,
    staleTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error instanceof UniversisError && error.status === 401) {
        // The token has run out. Let go of it, but not of the saved courses.
        void useUniversisAuth.getState().signOut();
        return false;
      }
      return failureCount < 2;
    },
  });

  const courses = query.data ?? saved ?? undefined;
  return {
    courses,
    connected: live,
    expired: !live && courses !== undefined,
    updatedAt: query.data ? query.dataUpdatedAt : savedAt,
    isRefreshing: query.isFetching,
    isLoading: live && query.isLoading && courses === undefined,
    isError: live && query.isError && courses === undefined,
    refetch: () => void query.refetch(),
  };
}

/** Reads the courses afresh, e.g. right after the student signs in again. */
export function refreshStudentCourses(): void {
  void queryClient.invalidateQueries({ queryKey: coursesKey });
}

/** Forgets the student's Universis link entirely: the token & the saved courses. */
export async function disconnectUniversis(): Promise<void> {
  await useUniversisAuth.getState().signOut();
  useSavedCourses.getState().clear();
  queryClient.removeQueries({ queryKey: coursesKey });
}
