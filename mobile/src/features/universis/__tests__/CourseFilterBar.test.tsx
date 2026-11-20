import { render, screen, userEvent } from '@testing-library/react-native';

import '@/i18n';

import { CourseFilterBar } from '../CourseFilterBar';
import type { CourseFilterBarProps } from '../CourseFilterBar';

const base: CourseFilterBarProps = {
  status: 'ready',
  filter: 'all',
  onFilter: jest.fn(),
  onConnect: jest.fn(),
};

describe('CourseFilterBar', () => {
  it('offers a chip to link Universis, not a banner, when the student is not linked', async () => {
    const onConnect = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} status="disconnected" onConnect={onConnect} />);

    await user.press(await screen.findByRole('button', { name: 'Τα μαθήματά μου' }));
    expect(onConnect).toHaveBeenCalled();
    expect(screen.queryByTestId('course-filter-owed')).not.toBeOnTheScreen();
  });

  it('shows the declared, owed & all chips once there are courses & reports a change', async () => {
    const onFilter = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} onFilter={onFilter} />);

    expect(await screen.findByTestId('course-filter-all')).toBeOnTheScreen();
    await user.press(screen.getByTestId('course-filter-registered'));
    expect(onFilter).toHaveBeenCalledWith('registered');
  });

  it('says so while the courses are first being read', async () => {
    await render(<CourseFilterBar {...base} status="loading" />);

    expect(await screen.findByText('Φόρτωση από το Universis…')).toBeOnTheScreen();
  });

  it('offers a retry when the courses could not be read', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} status="error" onRetry={onRetry} />);

    await user.press(await screen.findByRole('button', { name: 'Universis: ξανά' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('keeps the chips & says the saved courses may be out of date once expired', async () => {
    const onConnect = jest.fn();
    const user = userEvent.setup();
    await render(
      <CourseFilterBar {...base} expired updatedAt={Date.now()} onConnect={onConnect} />,
    );

    expect(await screen.findByTestId('course-filter-registered')).toBeOnTheScreen();
    expect(screen.getByText('Η σύνδεση με το Universis έληξε')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Σύνδεση ξανά' }));
    expect(onConnect).toHaveBeenCalled();
  });
});
