import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { useUniversisAuth } from './auth';
import { loadStudentCourses, UniversisError } from './client';
import type { StudentCourse } from './types';

/**
 * The signed-in student's courses from Universis. Disabled until the student
 * has linked their account; a 401 (an expired token) signs them out so the
 * screen can offer to link again, & is not retried.
 */
export function useStudentCourses(): UseQueryResult<StudentCourse[]> {
  const token = useUniversisAuth((s) => s.token);
  const signOut = useUniversisAuth((s) => s.signOut);

  return useQuery({
    queryKey: ['universis', 'courses', token],
    queryFn: ({ signal }) => loadStudentCourses(token!, { signal }),
    enabled: token !== null,
    staleTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error instanceof UniversisError && error.status === 401) {
        void signOut();
        return false;
      }
      return failureCount < 2;
    },
  });
}
