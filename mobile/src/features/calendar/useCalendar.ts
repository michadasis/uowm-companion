import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { apiUrl, getJson } from '@/lib/api';

import { academicCalendarSchema } from './schema';
import type { AcademicCalendar } from './schema';

const hour = 60 * 60 * 1000;

/**
 * The academic year's calendar. It is decided once a year, so a copy a few
 * hours old is as good as a fresh one, & the cached copy keeps the Home
 * screen's message right offline.
 */
export function useCalendar(): UseQueryResult<AcademicCalendar> {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: ({ signal }) => getJson('/api/calendar', academicCalendarSchema, signal),
    enabled: apiUrl !== null,
    staleTime: 6 * hour,
  });
}
