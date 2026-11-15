import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import '@/i18n';
import * as api from '@/lib/api';

import { AnnouncementsFeed } from '../AnnouncementsFeed';
import type { AnnouncementsResponse } from '../schema';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

jest.mock('@/lib/api', () => ({
  apiUrl: 'https://backend.test',
  getJson: jest.fn(),
}));

const getJson = api.getJson as jest.MockedFunction<typeof api.getJson>;
const push = jest.fn();

const feed: AnnouncementsResponse = {
  source: { kind: 'department', id: 'cs' },
  announcements: [
    {
      id: 'cs:1',
      title: 'Ανακοίνωση βαθμολογιών',
      date: '2026-11-09T10:00:00.000Z',
      excerpt: 'Οι βαθμολογίες αναρτήθηκαν.',
      body: [],
      images: [],
      attachments: [],
      sourceUrl: 'https://cs.uowm.gr/one/',
    },
    {
      id: 'cs:2',
      title: 'Πρόγραμμα εξετάσεων',
      date: '2026-11-06T10:00:00.000Z',
      excerpt: 'Το νέο πρόγραμμα.',
      body: [],
      images: [],
      attachments: [],
      sourceUrl: 'https://cs.uowm.gr/two/',
    },
  ],
};

async function renderFeed() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  await render(<AnnouncementsFeed scope="cs" />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push });
});

describe('AnnouncementsFeed', () => {
  it('shows a loading placeholder, then the announcements', async () => {
    getJson.mockReturnValue(new Promise(() => {}));
    await renderFeed();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('lists the announcements once they load', async () => {
    getJson.mockResolvedValue(feed);
    await renderFeed();

    expect(await screen.findByText('Ανακοίνωση βαθμολογιών')).toBeOnTheScreen();
    expect(screen.getByText('Πρόγραμμα εξετάσεων')).toBeOnTheScreen();
  });

  it('filters the list as the student searches', async () => {
    getJson.mockResolvedValue(feed);
    const user = userEvent.setup();
    await renderFeed();
    await screen.findByText('Ανακοίνωση βαθμολογιών');

    await user.type(screen.getByLabelText('Αναζήτηση ανακοινώσεων'), 'εξετάσεων');

    expect(screen.getByText('Πρόγραμμα εξετάσεων')).toBeOnTheScreen();
    expect(screen.queryByText('Ανακοίνωση βαθμολογιών')).not.toBeOnTheScreen();
  });

  it('opens the reader when a card is tapped', async () => {
    getJson.mockResolvedValue(feed);
    const user = userEvent.setup();
    await renderFeed();

    await user.press(await screen.findByText('Ανακοίνωση βαθμολογιών'));

    expect(push).toHaveBeenCalledWith({ pathname: '/announcement/[id]', params: { id: 'cs:1' } });
  });

  it('explains an empty feed', async () => {
    getJson.mockResolvedValue({ ...feed, announcements: [] });
    await renderFeed();

    expect(await screen.findByRole('header', { name: 'Καμία ανακοίνωση ακόμα' })).toBeOnTheScreen();
  });

  it('offers a retry when the feed fails to load', async () => {
    getJson.mockRejectedValue(new Error('boom'));
    await renderFeed();

    expect(await screen.findByRole('button', { name: 'Δοκίμασε ξανά' })).toBeOnTheScreen();
  });
});
