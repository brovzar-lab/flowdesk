export interface ChromeSession {
  taskId: string;
  taskTitle: string;
  endsAt: number;
  blockedDomains: string[];
  overridesLeft: number;
  overrideExceptions: Array<{ domain: string; expiresAt: number }>;
}

const BLOCKED_DOMAINS = ['twitter.com', 'reddit.com', 'youtube.com', 'instagram.com', 'tiktok.com'];

function hasChromeStorage(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as unknown as { chrome?: { storage?: unknown } }).chrome?.storage !== 'undefined';
}

export function writeSessionToExtension(taskId: string, taskTitle: string, durationSec: number): void {
  if (!hasChromeStorage()) return;

  const session: ChromeSession = {
    taskId,
    taskTitle,
    endsAt: Date.now() + durationSec * 1000,
    blockedDomains: BLOCKED_DOMAINS,
    overridesLeft: 2,
    overrideExceptions: [],
  };

  (window as unknown as { chrome: { storage: { local: { set: (v: unknown) => void } } } })
    .chrome.storage.local.set({ activeSession: session });
}

export function clearSessionFromExtension(): void {
  if (!hasChromeStorage()) return;

  (window as unknown as { chrome: { storage: { local: { remove: (k: string) => void } } } })
    .chrome.storage.local.remove('activeSession');
}
