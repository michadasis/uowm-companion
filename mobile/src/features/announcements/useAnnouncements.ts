import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { apiUrl, getJson } from '@/lib/api';

import { announcementsResponseSchema } from './schema';
import type { Announcement, AnnouncementsResponse } from './schema';

/** A feed is either a department (by id) or the university-wide one. */
export type Scope = string;

export const universityScope: Scope = 'university';

function path(scope: Scope): string {
  return scope === universityScope
    ? '/api/announcements?scope=university'
    : `/api/announcements?dept=${encodeURIComponent(scope)}`;
}

export function announcementsQueryKey(scope: Scope) {
  return ['announcements', scope] as const;
}

export function useAnnouncements(scope: Scope): UseQueryResult<AnnouncementsResponse> {
  return useQuery({
    queryKey: announcementsQueryKey(scope),
    queryFn: ({ signal }) => getJson(path(scope), announcementsResponseSchema, signal),
    enabled: apiUrl !== null,
  });
}

/** The scope an announcement belongs to is the part of its id before the colon. */
export function scopeOfId(id: string): Scope {
  const colon = id.indexOf(':');
  return colon === -1 ? id : id.slice(0, colon);
}

export function findById(
  response: AnnouncementsResponse | undefined,
  id: string,
): Announcement | undefined {
  return response?.announcements.find((announcement) => announcement.id === id);
}

export function findBySourceUrl(
  response: AnnouncementsResponse | undefined,
  url: string,
): Announcement | undefined {
  return response?.announcements.find((announcement) => announcement.sourceUrl === url);
}
