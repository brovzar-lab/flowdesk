export const isDemoMode =
  !import.meta.env.VITE_FIREBASE_API_KEY ||
  import.meta.env.VITE_FIREBASE_API_KEY === 'REPLACE_WITH_VALUE';
