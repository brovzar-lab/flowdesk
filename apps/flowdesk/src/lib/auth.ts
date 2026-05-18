import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  setUser: (user: User | null, accessToken?: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  accessToken: null,
  setUser: (user, accessToken = null) => set({ user, accessToken }),
  setLoading: (loading) => set({ loading }),
}));

export function initAuth(): () => void {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setUser(user ?? null);
    useAuthStore.getState().setLoading(false);
  });
  return unsubscribe;
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken ?? null;
  useAuthStore.getState().setUser(result.user, accessToken);
}

export async function signOutUser(): Promise<void> {
  const auth = getAuth();
  await signOut(auth);
  useAuthStore.getState().setUser(null);
}
