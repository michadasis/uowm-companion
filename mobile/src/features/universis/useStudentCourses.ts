import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryClient } from '@/lib/query';

import { isTokenExpired, useUniversisAuth } from './auth';
import { loadStudentCourses, UniversisError, fetchStudentName } from './client';
import { useSavedCourses } from './saved';
import type { StudentCourse } from './types';

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

  const query = useQuery({
    queryKey: coursesKey,
    queryFn: async ({ signal }) => {
      const [courses, givenName] = await Promise.all([
        loadStudentCourses(token!, { signal }),
        // The name is a nicety: a failure to read it leaves the courses be.
        fetchStudentName(token!, { signal }).catch(() => undefined),
      ]);
      useSavedCourses.getState().save(courses, givenName);
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
