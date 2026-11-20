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

function renderMenu() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<MenuView />, { wrapper });
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
});
