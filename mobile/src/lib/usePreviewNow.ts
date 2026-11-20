import { useGlobalSearchParams } from 'expo-router';

/**
 * The moment the app treats as now. A development build can be shown another
 * day for previews — /?today=2026-12-28 — to see a holiday or the exams
 * without waiting for one; a release build always uses the clock.
 */
export function usePreviewNow(): Date {
  const { today } = useGlobalSearchParams<{ today?: string }>();
  if (__DEV__ && typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return new Date(`${today}T10:00`);
  }
  return new Date();
}
