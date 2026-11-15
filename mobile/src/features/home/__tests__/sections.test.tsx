import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import '@/i18n';
import * as api from '@/lib/api';
import { todayName } from '@/features/menu/useMenu';

import { LatestAnnouncementsSection, NextUpSection, TodayMenuSection } from '../sections';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiUrl: 'https://backend.test', getJson: jest.fn() }));

const getJson = api.getJson as jest.MockedFunction<typeof api.getJson>;

// Route the mocked request by the path it was called with.
function respond(byPath: Record<string, unknown>) {
  getJson.mockImplementation((path: string) => {
    const key = Object.keys(byPath).find((p) => path.startsWith(p));
    if (!key) return Promise.reject(new Error(`no stub for ${path}`));
    return Promise.resolve(byPath[key] as never);
  });
}

async function renderSection(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
});

describe('NextUpSection', () => {
  it('shows the next exam when one is coming', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    respond({
      '/api/exams': {
        dept: 'cs',
        kind: 'exams',
        available: true,
        document: null,
        exams: [{ course: 'Αλγόριθμοι', date: future, startTime: '09:00', room: 'Α2' }],
        classes: [],
        original: [],
      },
    });
    await renderSection(<NextUpSection scope="cs" />);

    expect(await screen.findByText('Αλγόριθμοι')).toBeOnTheScreen();
    expect(screen.getByText('Α2')).toBeOnTheScreen();
  });

  it('falls back to the placeholder when no exam is coming', async () => {
    respond({
      '/api/exams': {
        dept: 'cs',
        kind: 'exams',
        available: true,
        document: null,
        exams: [{ course: 'Παλιό', date: '2020-01-01', startTime: '09:00' }],
        classes: [],
        original: [],
      },
    });
    await renderSection(<NextUpSection scope="cs" />);

    expect(
      await screen.findByText('Το επόμενο μάθημα ή η επόμενη εξέτασή σου θα εμφανίζεται εδώ.'),
    ).toBeOnTheScreen();
  });
});

describe('TodayMenuSection', () => {
  it("shows today's lunch mains", async () => {
    respond({
      '/api/menu': {
        cycleWeeks: 2,
        week: 1,
        currentWeek: 1,
        days: [
          {
            day: todayName(),
            lunch: { first: [], main: [{ el: 'Μουσακάς', en: 'Moussaka' }], extra: [] },
            dinner: { first: [], main: [], extra: [] },
          },
        ],
        breakfast: [],
        sourceUrl: null,
      },
    });
    await renderSection(<TodayMenuSection />);

    expect(await screen.findByText('Μουσακάς')).toBeOnTheScreen();
  });
});

describe('LatestAnnouncementsSection', () => {
  it('shows the three most recent announcements', async () => {
    respond({
      '/api/announcements': {
        source: { kind: 'department', id: 'cs' },
        announcements: [1, 2, 3, 4].map((n) => ({
          id: `cs:${n}`,
          title: `Ανακοίνωση ${n}`,
          date: '2026-11-09T10:00:00.000Z',
          excerpt: '',
          body: [],
          images: [],
          attachments: [],
          sourceUrl: `https://cs.uowm.gr/${n}/`,
        })),
      },
    });
    await renderSection(<LatestAnnouncementsSection scope="cs" />);

    expect(await screen.findByText('Ανακοίνωση 1')).toBeOnTheScreen();
    expect(screen.getByText('Ανακοίνωση 3')).toBeOnTheScreen();
    expect(screen.queryByText('Ανακοίνωση 4')).not.toBeOnTheScreen();
  });
});
