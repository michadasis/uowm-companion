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
