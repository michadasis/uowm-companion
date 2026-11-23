import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import '@/i18n';
import * as api from '@/lib/api';

import { MenuView } from '../MenuView';
import type { MenuResponse } from '../schema';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual<typeof import('@/lib/api')>('@/lib/api'),
  apiUrl: 'https://backend.test',
  getJson: jest.fn(),
}));
const getJson = api.getJson as jest.MockedFunction<typeof api.getJson>;

const menu: MenuResponse = {
  cycleWeeks: 2,
  week: 1,
  currentWeek: 1,
  days: [
    {
      day: 'monday',
      lunch: {
        first: [{ el: 'Κρεατόσουπα', en: 'Meat soup' }],
        main: [{ el: 'Μοσχαράκι κοκκινιστό', en: 'Braised veal' }],
        extra: [{ el: 'Γλυκό', en: 'Sweet' }],
      },
      dinner: { first: [], main: [], extra: [] },
    },
  ],
  breakfast: [{ category: 'drinks', items: [{ el: 'Τσάι', en: 'Tea' }] }],
  sourceUrl: 'https://uowm.gr/menu.pdf',
};

// Monday 23 November 2026 at 13:00, when lunch is served.
function renderMenu(now = new Date(2026, 10, 23, 13)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<MenuView now={now} />, { wrapper });
}

beforeEach(() => jest.clearAllMocks());

describe('MenuView', () => {
  it('shows the lunch of the first day with its courses', async () => {
    getJson.mockResolvedValue(menu);
    await renderMenu();

    expect(await screen.findByText('Μοσχαράκι κοκκινιστό')).toBeOnTheScreen();
    expect(screen.getByText('Κυρίως πιάτο')).toBeOnTheScreen();
    expect(screen.getByText('Κρεατόσουπα')).toBeOnTheScreen();
  });

  it('switches to breakfast, which is grouped by category', async () => {
    getJson.mockResolvedValue(menu);
    const user = userEvent.setup();
    await renderMenu();
    await screen.findByText('Μοσχαράκι κοκκινιστό');

    await user.press(screen.getByRole('radio', { name: 'Πρωινό' }));

    expect(screen.getByText('Ροφήματα')).toBeOnTheScreen();
    expect(screen.getByText('Τσάι')).toBeOnTheScreen();
  });

  it('says when a meal has no menu', async () => {
    getJson.mockResolvedValue(menu);
    const user = userEvent.setup();
    await renderMenu();
    await screen.findByText('Μοσχαράκι κοκκινιστό');

    await user.press(screen.getByRole('radio', { name: 'Βραδινό' }));

    expect(screen.getByText('Δεν υπάρχει μενού γι’ αυτό το γεύμα.')).toBeOnTheScreen();
  });

  it('explains when there is no menu at all', async () => {
    getJson.mockResolvedValue({ ...menu, days: [] });
    await renderMenu();

    expect(await screen.findByRole('header', { name: 'Κανένα μενού ακόμα' })).toBeOnTheScreen();
  });

  it('offers a retry when the menu fails to load', async () => {
    getJson.mockRejectedValue(new Error('boom'));
    await renderMenu();

    expect(await screen.findByRole('button', { name: 'Δοκίμασε ξανά' })).toBeOnTheScreen();
  });
  it('shows the week the phone is in, worked out from every week of the cycle', async () => {
    const none = { first: [], main: [], extra: [] };
    const lunch = (main: string) => ({ ...none, main: [{ el: main, en: main }] });
    getJson.mockResolvedValue({
      ...menu,
      // The backend's own idea of the week, which a kept copy can outlive.
      week: 1,
      days: [{ day: 'monday', lunch: lunch('Φασολάδα'), dinner: none }],
      weeks: [
        { week: 1, days: [{ day: 'monday', lunch: lunch('Φασολάδα'), dinner: none }] },
        { week: 2, days: [{ day: 'monday', lunch: lunch('Γεμιστά'), dinner: none }] },
      ],
      cycleAnchor: '2025-09-08',
    } satisfies MenuResponse);
    // Monday 13 October 2025 is week 2 of the cycle.
    await renderMenu(new Date(2025, 9, 13, 12));

    expect(await screen.findByText('Γεμιστά')).toBeOnTheScreen();
  });
  it('opens on dinner once lunch is over', async () => {
    getJson.mockResolvedValue(menu);
    await renderMenu(new Date(2026, 10, 23, 18, 30));

    expect(await screen.findByText('Δεν υπάρχει μενού γι’ αυτό το γεύμα.')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Βραδινό', checked: true })).toBeOnTheScreen();
  });

  it('opens on breakfast in the morning', async () => {
    getJson.mockResolvedValue(menu);
    await renderMenu(new Date(2026, 10, 23, 8, 15));

    expect(await screen.findByText('Τσάι')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Πρωινό', checked: true })).toBeOnTheScreen();
  });
});
