import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplash } from '../AnimatedSplash';
import { splashDuration } from '../timeline';

jest.mock('expo-splash-screen', () => ({ hide: jest.fn() }));

const mockReducedMotion = jest.fn(() => false);
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: () => mockReducedMotion(),
}));

const layout = { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } } };

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
  mockReducedMotion.mockReturnValue(false);
});

describe('AnimatedSplash', () => {
  it('hides the native splash once it is on screen & finishes after the animation', async () => {
    const onDone = jest.fn();
    await render(<AnimatedSplash onDone={onDone} />);
    expect(SplashScreen.hide).not.toHaveBeenCalled();

    await act(() =>
      fireEvent(
        screen.getByTestId('animated-splash', { includeHiddenElements: true }),
        'layout',
        layout,
      ),
    );
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTime(splashDuration - 100));
    expect(onDone).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(200));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('only fades when the system asks for reduced motion', async () => {
    mockReducedMotion.mockReturnValue(true);
    const onDone = jest.fn();
    await render(<AnimatedSplash onDone={onDone} />);

    await act(() =>
      fireEvent(
        screen.getByTestId('animated-splash', { includeHiddenElements: true }),
        'layout',
        layout,
      ),
    );
    await act(() => jest.advanceTimersByTime(300));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('starts only once, however often it is laid out', async () => {
    await render(<AnimatedSplash onDone={jest.fn()} />);
    const splash = screen.getByTestId('animated-splash', { includeHiddenElements: true });

    await act(() => fireEvent(splash, 'layout', layout));
    await act(() => fireEvent(splash, 'layout', layout));
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });
});
