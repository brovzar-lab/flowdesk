export interface ChromeSession {
  taskId: string;
  taskTitle: string;
  endsAt: number;
  blockedDomains: string[];
  overridesLeft: number;
  overrideExceptions: Array<{ domain: string; expiresAt: number }>;
}

export interface ExtensionSettings {
  userId: string;
  focusMode: boolean;
  blockedSites: string[];
}

const FALLBACK_BLOCKED_DOMAINS = [
  'twitter.com',
  'reddit.com',
  'youtube.com',
  'instagram.com',
  'tiktok.com',
];

type ChromeWindow = typeof window & {
  chrome: {
    storage: {
      local: {
        set: (items: Record<string, unknown>) => void;
        remove: (key: string) => void;
      };
    };
  };
};

function hasChromeStorage(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { chrome?: { storage?: unknown } }).chrome?.storage !==
      'undefined'
  );
}

export function writeSessionToExtension(
  taskId: string,
  taskTitle: string,
  durationSec: number,
  blockedDomains?: string[],
): void {
  if (!hasChromeStorage()) return;

  const session: ChromeSession = {
    taskId,
    taskTitle,
    endsAt: Date.now() + durationSec * 1000,
    blockedDomains: blockedDomains ?? FALLBACK_BLOCKED_DOMAINS,
    overridesLeft: 2,
    overrideExceptions: [],
  };

  (window as ChromeWindow).chrome.storage.local.set({ activeSession: session });
}

export function writeSettingsToExtension(settings: ExtensionSettings): void {
  if (!hasChromeStorage()) return;
  (window as ChromeWindow).chrome.storage.local.set({ flowdeskSettings: settings });
}

export function clearSessionFromExtension(): void {
  if (!hasChromeStorage()) return;
  (window as ChromeWindow).chrome.storage.local.remove('activeSession');
}
