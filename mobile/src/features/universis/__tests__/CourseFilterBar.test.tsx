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
  it('prompts to connect when the student is not linked', async () => {
    const onConnect = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} status="disconnected" onConnect={onConnect} />);

    await user.press(await screen.findByRole('button', { name: /^Σύνδεση:/ }));
    expect(onConnect).toHaveBeenCalled();
    expect(screen.queryByTestId('course-filter-owed')).not.toBeOnTheScreen();
  });

  it('shows the filter chips once there are courses & reports a change', async () => {
    const onFilter = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} onFilter={onFilter} />);

    expect(await screen.findByText('Συνδεδεμένο')).toBeOnTheScreen();
    await user.press(screen.getByTestId('course-filter-registered'));
    expect(onFilter).toHaveBeenCalledWith('registered');
  });

  it('says so while the courses are first being read', async () => {
    await render(<CourseFilterBar {...base} status="loading" />);

    expect(
      await screen.findByText('Φόρτωση των μαθημάτων σου από το Universis…'),
    ).toBeOnTheScreen();
  });

  it('offers a retry when the courses could not be read', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} status="error" onRetry={onRetry} />);

    await user.press(await screen.findByRole('button', { name: 'Δοκίμασε ξανά' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('keeps the chips & says the saved courses may be out of date once expired', async () => {
    const onConnect = jest.fn();
    const user = userEvent.setup();
    await render(
      <CourseFilterBar {...base} expired updatedAt={Date.now()} onConnect={onConnect} />,
    );

    expect(await screen.findByTestId('course-filter-owed')).toBeOnTheScreen();
    expect(screen.getByText('Η σύνδεση με το Universis έληξε')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Σύνδεση ξανά' }));
    expect(onConnect).toHaveBeenCalled();
  });

  it('lets a linked student disconnect', async () => {
    const onDisconnect = jest.fn();
    const user = userEvent.setup();
    await render(<CourseFilterBar {...base} onDisconnect={onDisconnect} />);

    await user.press(await screen.findByRole('button', { name: 'Αποσύνδεση' }));
    expect(onDisconnect).toHaveBeenCalled();
  });
});
