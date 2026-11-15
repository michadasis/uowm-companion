import { render, screen, userEvent } from '@testing-library/react-native';

import '@/i18n';

import { TimetableView } from '../TimetableView';
import type { ClassSession } from '../schema';

const classes: ClassSession[] = [
  { course: 'Ηλεκτρονική', day: 1, startTime: '09:00', endTime: '10:00', room: 'Μεγ. Αμφιθέατρο' },
  { course: 'Φυσική', day: 1, startTime: '11:00', endTime: '12:00', teacher: 'Θ. Παπαβασιλείου' },
  { course: 'Μεταγλωττιστές', day: 2, startTime: '13:00', endTime: '14:00' },
];

// Monday 19 January 2026, 11:30 — during the second Monday class.
const monday = new Date('2026-01-19T11:30:00');

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
});
