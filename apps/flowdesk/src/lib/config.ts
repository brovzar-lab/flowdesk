export const isDemoMode =
  !import.meta.env.VITE_FIREBASE_API_KEY ||
  import.meta.env.VITE_FIREBASE_API_KEY === 'REPLACE_WITH_VALUE';

export const FREE_TASK_LIMIT = 3;
export const COCKPIT_DURATION_SEC = 25 * 60;
