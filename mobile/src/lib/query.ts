import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { AppState, Platform } from 'react-native';

import { ApiError } from './api';

const day = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // Anything dropped from memory is also dropped from the saved cache, so
      // this has to outlast `maxAge` below for offline reading to work.
      gcTime: 7 * day,
      // A response the app cannot parse will not parse on a second attempt.
      retry: (failures, error) =>
        failures < 2 && !(error instanceof ApiError && error.kind === 'invalid'),
    },
  },
});

/**
 * Saves the query cache to the device, so the last content fetched is there
 * on the next launch, with or without a connection. A new app version starts
 * from an empty cache: what an old version saved may no longer match what
 * the new one expects.
 */
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage, key: 'query-cache' }),
  maxAge: 7 * day,
  buster: Constants.expoConfig?.version ?? 'unknown',
};

/**
 * React Query assumes a browser. On a phone it has to be told when the
 * connection comes back and when the app returns to the foreground, which
 * are the two moments stale content gets refreshed.
 */
export function connectQueryClientToDevice(): () => void {
  if (Platform.OS === 'web') return () => {};

  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      // `isInternetReachable` is unknown for a moment after a change; treat
      // unknown as online rather than pausing every query.
      setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    });
    return () => subscription.remove();
  });

  const subscription = AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}
