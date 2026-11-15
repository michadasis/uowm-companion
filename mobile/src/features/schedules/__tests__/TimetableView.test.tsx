import { render, screen, userEvent } from '@testing-library/react-native';

import '@/i18n';
import { useSettings } from '@/features/settings/store';

import { TimetableView } from '../TimetableView';
import type { ClassSession } from '../schema';

const classes: ClassSession[] = [
  { course: 'Ηλεκτρονική', day: 1, startTime: '09:00', endTime: '10:00', room: 'Μεγ. Αμφιθέατρο', semester: 'Α΄' },
  { course: 'Φυσική', day: 1, startTime: '11:00', endTime: '12:00', teacher: 'Θ. Παπαβασιλείου', semester: 'Α΄' },
  { course: 'Μεταγλωττιστές', day: 2, startTime: '13:00', endTime: '14:00', semester: 'Α΄' },
  { course: 'Ασφάλεια Δικτύων', day: 1, startTime: '11:00', endTime: '12:00', semester: 'Γ΄' },
];

// Monday 19 January 2026, 11:30 — during the second Monday class.
const monday = new Date('2026-01-19T11:30:00');

beforeEach(() => {
  useSettings.setState({ semester: null });
});

describe('TimetableView', () => {
  it("opens on today & flags the class in progress", async () => {
    await render(<TimetableView classes={classes} now={monday} />);

    expect(await screen.findByText('Ηλεκτρονική')).toBeOnTheScreen();
    expect(screen.getByText('Φυσική')).toBeOnTheScreen();
    expect(screen.getByText('Τώρα')).toBeOnTheScreen();
    expect(screen.queryByText('Μεταγλωττιστές')).not.toBeOnTheScreen();
  });

  it('shows another day when its chip is tapped', async () => {
    const user = userEvent.setup();
    await render(<TimetableView classes={classes} now={monday} />);

    await user.press(await screen.findByTestId('timetable-day-2'));

    expect(await screen.findByText('Μεταγλωττιστές')).toBeOnTheScreen();
    expect(screen.queryByText('Φυσική')).not.toBeOnTheScreen();
  });

  it('filters to one semester & remembers the choice', async () => {
    const user = userEvent.setup();
    await render(<TimetableView classes={classes} now={monday} />);

    // Both semesters' Monday 11:00 classes show until one is picked.
    expect(await screen.findByText('Φυσική')).toBeOnTheScreen();
    expect(screen.getByText('Ασφάλεια Δικτύων')).toBeOnTheScreen();

    await user.press(screen.getByTestId('timetable-semester-Γ΄'));

    expect(await screen.findByText('Ασφάλεια Δικτύων')).toBeOnTheScreen();
    expect(screen.queryByText('Φυσική')).not.toBeOnTheScreen();
    expect(useSettings.getState().semester).toBe('Γ΄');
  });
});
