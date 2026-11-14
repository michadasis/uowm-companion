import { render, screen, userEvent } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar, Text } from '@/design';

function setup({ prevented = false } = {}) {
  const emit = jest.fn(() => ({ defaultPrevented: prevented }));
  const navigateToTab = jest.fn();
  const routes = [
    { key: 'home-key', name: 'index' },
    { key: 'more-key', name: 'more' },
  ];
  const props = {
    state: { index: 0, routes },
    descriptors: {
      'home-key': {
        options: {
          title: 'Αρχική',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <Text>{focused ? 'home-filled' : 'home-outline'}</Text>
          ),
        },
      },
      'more-key': { options: { title: 'Περισσότερα' } },
    },
    emitter: { emit },
    navigateToTab,
    insets: { top: 0, right: 0, bottom: 16, left: 0 },
  } as unknown as BottomTabBarProps;

  return { props, emit, navigateToTab };
}

describe('TabBar', () => {
  it('shows a tab per route and marks the current one', async () => {
    const { props } = setup();
    await render(<TabBar {...props} />);

    expect(screen.getByRole('tab', { name: 'Αρχική' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Περισσότερα' })).not.toBeSelected();
    expect(screen.getByText('home-filled')).toBeOnTheScreen();
  });

  it('switches to a tab when it is pressed', async () => {
    const { props, emit, navigateToTab } = setup();
    const user = userEvent.setup();
    await render(<TabBar {...props} />);

    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));

    expect(emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'more-key',
      canPreventDefault: true,
    });
    expect(navigateToTab).toHaveBeenCalledWith('more-key');
  });

  it('tells the current tab it was pressed again without navigating', async () => {
    const { props, emit, navigateToTab } = setup();
    const user = userEvent.setup();
    await render(<TabBar {...props} />);

    await user.press(screen.getByRole('tab', { name: 'Αρχική' }));

    expect(emit).toHaveBeenCalledTimes(1);
    expect(navigateToTab).not.toHaveBeenCalled();
  });

  it('stays put when a screen cancels the press', async () => {
    const { props, navigateToTab } = setup({ prevented: true });
    const user = userEvent.setup();
    await render(<TabBar {...props} />);

    await user.press(screen.getByRole('tab', { name: 'Περισσότερα' }));

    expect(navigateToTab).not.toHaveBeenCalled();
  });
});
