import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// The Bearer token is sensitive, so it lives in the device keychain, never in
// the plain settings store or the query cache.
const TOKEN_KEY = 'universis_access_token';

interface UniversisAuth {
  token: string | null;
  /** False until the keychain has been read on launch. */
  hydrated: boolean;
  /** Saves the token from a finished sign-in. */
  signIn: (token: string) => Promise<void>;
  /** Forgets the token, e.g. after it expires or the student asks. */
  signOut: () => Promise<void>;
}

export const useUniversisAuth = create<UniversisAuth>((set) => ({
  token: null,
  hydrated: false,
  signIn: async (token) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      // A keychain write can fail; keep the token in memory for this session.
    }
    set({ token });
  },
  signOut: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // Nothing more to do; the in-memory token is cleared regardless.
    }
    set({ token: null });
  },
}));

/** Reads the saved token once on launch so a linked student stays linked. */
export async function hydrateUniversisAuth(): Promise<void> {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    token = null;
  }
  useUniversisAuth.setState({ token, hydrated: true });
}

/**
 * Whether a Universis token has already run out, read from the expiry it
 * carries. A token that is not a readable JWT counts as live: the server will
 * say otherwise with a 401, which signs the student out just the same.
 */
export function isTokenExpired(token: string, now: number = Date.now()): boolean {
  const payload = token.split('.')[1];
  if (!payload) return false;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === 'number' && exp * 1000 <= now;
  } catch {
    return false;
  }
}

/** The claims a JWT carries, read without checking it; null for one that won't read. */
export function tokenClaims(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // atob gives bytes; a Greek name in them is UTF-8.
    const json = decodeURIComponent(
      Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    );
    const claims: unknown = JSON.parse(json);
    return claims && typeof claims === 'object' ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The given name a sign-in token states, if it states one. */
export function givenNameFromToken(token: string): string | undefined {
  const claims = tokenClaims(token);
  for (const key of ['given_name', 'givenName', 'first_name', 'firstName']) {
    const value = claims?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}
