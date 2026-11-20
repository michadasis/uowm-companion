import * as SecureStore from 'expo-secure-store';

import {
  givenNameFromToken,
  hydrateUniversisAuth,
  isTokenExpired,
  useUniversisAuth,
} from '../auth';

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

describe('isTokenExpired', () => {
  const jwt = (exp: number) =>
    ['h', btoa(JSON.stringify({ exp })).replace(/=+$/, ''), 's'].join('.');
  const now = 1_800_000_000_000;

  it('reads the expiry a JWT carries', () => {
    expect(isTokenExpired(jwt(now / 1000 - 60), now)).toBe(true);
    expect(isTokenExpired(jwt(now / 1000 + 3600), now)).toBe(false);
  });

  it('treats a token it cannot read as live', () => {
    expect(isTokenExpired('opaque-token', now)).toBe(false);
  });
});

describe('givenNameFromToken', () => {
  const jwt = (claims: object) => {
    const bytes = new TextEncoder().encode(JSON.stringify(claims));
    const base64 = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `h.${base64}.s`;
  };

  it('reads a Greek given name a token states', () => {
    expect(givenNameFromToken(jwt({ given_name: 'Ιωάννης' }))).toBe('Ιωάννης');
  });

  it('gives nothing for a token that states none, or that is no JWT', () => {
    expect(givenNameFromToken(jwt({ sub: 'x' }))).toBeUndefined();
    expect(givenNameFromToken('opaque-token')).toBeUndefined();
  });
});
