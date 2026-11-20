import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';

import '@/i18n';
import * as api from '@/lib/api';
import { useSettings } from '@/features/settings/store';
import { useUniversisAuth } from '@/features/universis/auth';

import { ScheduleView } from '../ScheduleView';
import type { ScheduleResponse } from '../schema';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('@/lib/api', () => ({ apiUrl: 'https://backend.test', getJson: jest.fn() }));

const getJson = api.getJson as jest.MockedFunction<typeof api.getJson>;

const withDocument: ScheduleResponse = {
  dept: 'cs',
  kind: 'exams',
  available: true,
  document: {
    url: 'https://cs.uowm.gr/exams.docx',
    label: 'Πρόγραμμα Σεπτεμβρίου',
    format: 'docx',
  },
  exams: [],
  classes: [],
  original: [{ type: 'paragraph', content: [{ text: 'Η εξεταστική ξεκινά τη Δευτέρα.' }] }],
};

function renderView(kind: ScheduleResponse['kind'] = 'exams') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<ScheduleView scope="cs" kind={kind} />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  useUniversisAuth.setState({ token: null });
  useSettings.setState({ courseFilter: 'all' });
});

describe('ScheduleView', () => {
  it('shows the document & its Original view when it did not parse', async () => {
    getJson.mockResolvedValue(withDocument);
    await renderView();

    expect(await screen.findByText('Πρόγραμμα Σεπτεμβρίου')).toBeOnTheScreen();
    expect(screen.getByText('Η εξεταστική ξεκινά τη Δευτέρα.')).toBeOnTheScreen();
  });

  it('shows the agenda when the exam schedule parsed', async () => {
    getJson.mockResolvedValue({
      ...withDocument,
      exams: [
        {
          course: 'Αλγόριθμοι και Πολυπλοκότητα',
          date: '2026-08-31',
          startTime: '11:00',
          endTime: '13:00',
          room: 'Μ.Αμφ.',
          examiners: ['Ν. Δημόκας'],
        },
      ],
    });
    await renderView();

    expect(await screen.findByText('Αλγόριθμοι και Πολυπλοκότητα')).toBeOnTheScreen();
    expect(screen.getByText('11:00 - 13:00')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Δευτέρα 31 Αυγούστου' })).toBeOnTheScreen();
    expect(screen.getByText('Μ.Αμφ.')).toBeOnTheScreen();
  });

  it('shows the timetable when it parsed into classes', async () => {
    getJson.mockResolvedValue({
      ...withDocument,
      kind: 'timetable',
      classes: [
        { course: 'Ηλεκτρονική', day: 1, startTime: '09:00', endTime: '10:00', room: 'Μεγ. Αμφιθέατρο' },
      ],
    });
    await renderView('timetable');

    expect(await screen.findByText('Ηλεκτρονική')).toBeOnTheScreen();
    expect(screen.getByText('Μεγ. Αμφιθέατρο')).toBeOnTheScreen();
  });

  it('narrows the exams to the owed courses once Universis is linked', async () => {
    getJson.mockResolvedValue({
      ...withDocument,
      exams: [
        { course: 'Αλγόριθμοι', date: '2026-08-31', startTime: '09:00' },
        { course: 'Παλιό Μάθημα', date: '2026-09-01', startTime: '09:00' },
      ],
    });
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        { course: { name: 'Αλγόριθμοι' }, isPassed: false },
        { course: { name: 'Παλιό Μάθημα' }, isPassed: true },
      ],
    } as Response);
    useUniversisAuth.setState({ token: 'tok' });
    useSettings.setState({ courseFilter: 'owed' });

    await renderView('exams');

    expect(await screen.findByText('Αλγόριθμοι')).toBeOnTheScreen();
    expect(screen.queryByText('Παλιό Μάθημα')).not.toBeOnTheScreen();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('api1.uowm.gr/api/students/me/courses'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    );
    fetchMock.mockRestore();
  });

  it('opens the source document when asked', async () => {
    getJson.mockResolvedValue(withDocument);
    const user = userEvent.setup();
    await renderView();

    await user.press(await screen.findByRole('button', { name: 'Άνοιγμα εγγράφου' }));

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://cs.uowm.gr/exams.docx');
  });

  it('explains a department that publishes no exam schedule', async () => {
    getJson.mockResolvedValue({
      dept: 'ide',
      kind: 'exams',
      available: false,
      document: null,
      exams: [],
      classes: [],
      original: [],
    });
    await renderView();

    expect(
      await screen.findByRole('header', { name: 'Δεν υπάρχει πρόγραμμα εξεταστικής' }),
    ).toBeOnTheScreen();
  });

  it('says the next exam schedule is not out yet, not that there is none', async () => {
    getJson.mockResolvedValue({
      dept: 'cs',
      kind: 'exams',
      available: true,
      document: null,
      exams: [],
      classes: [],
      original: [],
    });
    await renderView();

    expect(
      await screen.findByRole('header', { name: 'Δεν έχει βγει ακόμα πρόγραμμα εξεταστικής' }),
    ).toBeOnTheScreen();
  });

  it('offers a retry when the schedule fails to load', async () => {
    getJson.mockRejectedValue(new Error('boom'));
    await renderView();

    expect(await screen.findByRole('button', { name: 'Δοκίμασε ξανά' })).toBeOnTheScreen();
  });
});
