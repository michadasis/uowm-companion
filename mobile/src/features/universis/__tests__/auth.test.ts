import * as SecureStore from 'expo-secure-store';

import { hydrateUniversisAuth, useUniversisAuth } from '../auth';

beforeEach(async () => {
  await SecureStore.deleteItemAsync('universis_access_token');
  useUniversisAuth.setState({ token: null, hydrated: false });
  jest.clearAllMocks();
});

describe('universis auth', () => {
  it('saves the token to the keychain on sign in', async () => {
    await useUniversisAuth.getState().signIn('tok-123');

    expect(useUniversisAuth.getState().token).toBe('tok-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('universis_access_token', 'tok-123');
  });

  it('clears the token from the keychain on sign out', async () => {
    await useUniversisAuth.getState().signIn('tok-123');
    await useUniversisAuth.getState().signOut();

    expect(useUniversisAuth.getState().token).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('universis_access_token');
  });

  it('restores a saved token on launch & marks itself hydrated', async () => {
    await SecureStore.setItemAsync('universis_access_token', 'saved-tok');

    await hydrateUniversisAuth();

    expect(useUniversisAuth.getState()).toMatchObject({ token: 'saved-tok', hydrated: true });
  });

  it('hydrates to no token when the keychain is empty', async () => {
    await hydrateUniversisAuth();
    expect(useUniversisAuth.getState()).toMatchObject({ token: null, hydrated: true });
  });
});
