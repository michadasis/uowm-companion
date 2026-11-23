import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import '@/i18n';
import * as api from '@/lib/api';
import { useSettings } from '@/features/settings/store';
import { useSavedCourses } from '@/features/universis/saved';

import { LatestAnnouncementsSection, NextUpSection, TodayMenuSection } from '../sections';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/lib/api', () => ({
  ...jest.requireActual<typeof import('@/lib/api')>('@/lib/api'),
  apiUrl: 'https://backend.test',
  getJson: jest.fn(),
}));

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
  useSettings.setState({ semester: null });
  useSavedCourses.setState({ courses: null, updatedAt: null });
});

const schedule = (kind: 'exams' | 'timetable', items: object[]) => ({
  dept: 'cs',
  kind,
  available: true,
  document: null,
  exams: kind === 'exams' ? items : [],
  classes: kind === 'timetable' ? items : [],
  original: [],
});

describe('NextUpSection', () => {
  const tomorrow = (new Date().getDay() + 1) % 7 || 7;

  it("shows the next class of the student's semester from the timetable", async () => {
    useSettings.setState({ semester: 'Α΄' });
    respond({
      '/api/exams': schedule('exams', []),
      '/api/timetable': schedule('timetable', [
        {
          course: 'Φυσική',
          day: tomorrow,
          startTime: '11:00',
          endTime: '12:00',
          semester: 'Α΄',
          room: 'Μ.Αμφ.',
        },
        {
          course: 'Μεταγλωττιστές',
          day: tomorrow,
          startTime: '09:00',
          endTime: '10:00',
          semester: 'Γ΄',
        },
      ]),
    });
    await renderSection(<NextUpSection scope="cs" city="kastoria" />);

    expect(await screen.findByText('Φυσική')).toBeOnTheScreen();
    // The time is set apart from the day, the way a diary reads.
    expect(screen.getByText('11:00')).toBeOnTheScreen();
    expect(screen.getByText('Αύριο')).toBeOnTheScreen();
    expect(screen.queryByText('Μεταγλωττιστές')).not.toBeOnTheScreen();
  });

  it('shows an exam of the semester when it comes before any class', async () => {
    useSettings.setState({ semester: 'Δ΄' });
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    respond({
      '/api/exams': schedule('exams', [
        { course: 'Αλγόριθμοι', date: soon, startTime: '09:00', room: 'Α2', semester: "Δ'" },
      ]),
      '/api/timetable': schedule('timetable', []),
    });
    await renderSection(<NextUpSection scope="cs" city="kastoria" />);

    expect(await screen.findByText('Αλγόριθμοι')).toBeOnTheScreen();
    expect(screen.getByText('Α2')).toBeOnTheScreen();
  });

  it("follows the student's Universis courses when they are linked", async () => {
    useSavedCourses.setState({
      courses: [{ name: 'ΦΥΣΙΚΗ', passed: false, registered: true }],
      updatedAt: Date.now(),
    });
    respond({
      '/api/exams': schedule('exams', []),
      '/api/timetable': schedule('timetable', [
        { course: 'Ηλεκτρονική', day: tomorrow, startTime: '09:00', endTime: '10:00' },
        { course: 'Φυσική', day: tomorrow, startTime: '11:00', endTime: '12:00' },
      ]),
    });
    await renderSection(<NextUpSection scope="cs" city="kastoria" />);

    expect(await screen.findByText('Φυσική')).toBeOnTheScreen();
    expect(screen.queryByText('Ηλεκτρονική')).not.toBeOnTheScreen();
  });

  it('asks the student to pick a semester when it cannot tell whose schedule it is', async () => {
    respond({
      '/api/exams': schedule('exams', []),
      '/api/timetable': schedule('timetable', [
        { course: 'Φυσική', day: tomorrow, startTime: '11:00', endTime: '12:00', semester: 'Α΄' },
      ]),
    });
    await renderSection(<NextUpSection scope="cs" city="kastoria" />);

    expect(
      await screen.findByText(
        'Διάλεξε εξάμηνο στο Ωρολόγιο ή σύνδεσε το Universis, για να βλέπεις εδώ το επόμενο μάθημά σου.',
      ),
    ).toBeOnTheScreen();
  });
});

describe('TodayMenuSection', () => {
  const none = { first: [], main: [], extra: [] };
  const menu = {
    cycleWeeks: 2,
    week: 1,
    currentWeek: 1,
    days: [
      {
        day: 'monday',
        lunch: { ...none, main: [{ el: 'Μουσακάς', en: 'Moussaka' }] },
        dinner: { ...none, main: [{ el: 'Φακές', en: 'Lentils' }] },
      },
    ],
    breakfast: [
      {
        category: 'drinks',
        items: [
          { el: 'Τσάι', en: 'Tea' },
          { el: 'Γάλα', en: 'Milk' },
        ],
      },
    ],
    sourceUrl: null,
  };

  // Monday 23 November 2026, at the given time.
  function at(hours: number, minutes = 0, date = new Date(2026, 10, 23)) {
    jest.useFakeTimers({
      now: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes),
      advanceTimers: true,
    });
  }

  afterEach(() => jest.useRealTimers());

  it("shows today's lunch mains at midday", async () => {
    at(13);
    respond({ '/api/menu': menu });
    await renderSection(<TodayMenuSection />);

    expect(await screen.findByText('Μουσακάς')).toBeOnTheScreen();
    expect(screen.getByText('Μεσημεριανό')).toBeOnTheScreen();
  });

  it("shows tonight's dinner once lunch is over", async () => {
    at(16);
    respond({ '/api/menu': menu });
    await renderSection(<TodayMenuSection />);

    expect(await screen.findByText('Φακές')).toBeOnTheScreen();
    expect(screen.getByText('Βραδινό')).toBeOnTheScreen();
  });

  it('shows breakfast in the morning, a line per group', async () => {
    at(8, 30);
    respond({ '/api/menu': menu });
    await renderSection(<TodayMenuSection />);

    expect(await screen.findByText('Τσάι, Γάλα')).toBeOnTheScreen();
    expect(screen.getByText('Πρωινό')).toBeOnTheScreen();
  });
});

describe('LatestAnnouncementsSection', () => {
  it('shows just the two most recent announcements, as lines', async () => {
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
    expect(screen.getByText('Ανακοίνωση 2')).toBeOnTheScreen();
    expect(screen.queryByText('Ανακοίνωση 3')).not.toBeOnTheScreen();
    expect(screen.queryByText('Ανακοίνωση 4')).not.toBeOnTheScreen();
  });
});
