import { render, screen, userEvent } from '@testing-library/react-native';

import '@/i18n';

import { CourseFilterBar } from '../CourseFilterBar';

describe('CourseFilterBar', () => {
  it('prompts to connect when the student is not linked', async () => {
    const onConnect = jest.fn();
    const user = userEvent.setup();
    await render(
      <CourseFilterBar linked={false} filter="all" onFilter={jest.fn()} onConnect={onConnect} />,
    );

    await user.press(await screen.findByRole('button', { name: 'Σύνδεση' }));
    expect(onConnect).toHaveBeenCalled();
  });

  it('shows the filter chips once linked & reports a change', async () => {
    const onFilter = jest.fn();
    const user = userEvent.setup();
    await render(
      <CourseFilterBar linked filter="all" onFilter={onFilter} onConnect={jest.fn()} />,
    );

    expect(await screen.findByText('Συνδεδεμένο')).toBeOnTheScreen();
    await user.press(screen.getByTestId('course-filter-owed'));
    expect(onFilter).toHaveBeenCalledWith('owed');
  });
});
