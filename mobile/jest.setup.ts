import { setUpTests } from 'react-native-reanimated';

setUpTests();

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-network', () => ({
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
}));
