import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';

import '@/i18n';
import * as api from '@/lib/api';

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
});

describe('ScheduleView', () => {
  it('shows the document & its Original view', async () => {
    getJson.mockResolvedValue(withDocument);
    await renderView();

    expect(await screen.findByText('Πρόγραμμα Σεπτεμβρίου')).toBeOnTheScreen();
    expect(screen.getByText('Η εξεταστική ξεκινά τη Δευτέρα.')).toBeOnTheScreen();
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

  it('offers a retry when the schedule fails to load', async () => {
    getJson.mockRejectedValue(new Error('boom'));
    await renderView();

    expect(await screen.findByRole('button', { name: 'Δοκίμασε ξανά' })).toBeOnTheScreen();
  });
});
