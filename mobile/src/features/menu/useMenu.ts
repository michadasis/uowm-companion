import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { apiUrl, getJson } from '@/lib/api';

import { menuResponseSchema } from './schema';
import type { MenuResponse } from './schema';

export function useMenu(week?: number): UseQueryResult<MenuResponse> {
  return useQuery({
    queryKey: ['menu', week ?? 'current'],
    queryFn: ({ signal }) =>
      getJson(`/api/menu${week ? `?week=${week}` : ''}`, menuResponseSchema, signal),
    enabled: apiUrl !== null,
  });
}

/** Today's day name, lowercase English, to default the menu to the right day. */
export function todayName(now = new Date()): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    now.getDay()
  ]!;
}
