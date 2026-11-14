import { useQuery } from '@tanstack/react-query';

import { apiUrl, getJson } from '@/lib/api';

import bundled from './directory.json';
import { directorySchema } from './schema';
import type { Department, Directory } from './schema';

/**
 * The copy of the directory that ships inside the app, generated from the
 * backend's registry. Picking a department is the first thing a student
 * does, and it must work on a first launch with no connection.
 */
export const bundledDirectory: Directory = directorySchema.parse(bundled);

/**
 * The cities, schools and departments. Always has data: it starts from the
 * bundled copy, which counts as stale, so the backend's version replaces it
 * in the background whenever it can be reached.
 */
export function useDirectory(): Directory {
  const { data } = useQuery({
    queryKey: ['directory'],
    queryFn: ({ signal }) => getJson('/api/departments', directorySchema, signal),
    initialData: bundledDirectory,
    initialDataUpdatedAt: 0,
    staleTime: 24 * 60 * 60 * 1000,
    enabled: apiUrl !== null,
  });
  return data;
}

export function findDepartment(directory: Directory, id: string | null): Department | undefined {
  return id === null ? undefined : directory.departments.find((entry) => entry.id === id);
}
