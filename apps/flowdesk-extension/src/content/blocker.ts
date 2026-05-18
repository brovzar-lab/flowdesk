import type { ActiveSession, StorageData } from '../shared/types';

// Demo mode: activate when Chrome extension APIs are unavailable
const isDemoMode = typeof chrome === 'undefined' || !chrome?.storage;

let banner: HTMLElement | null = null;
let currentSession: ActiveSession | null = null;

function getCurrentDomain(): string {
  return window.location.hostname.replace(/^www\./, '');
}

function isDomainBlocked(session: ActiveSession, domain: string): boolean {
  if (!session.blockedDomains.includes(domain)) return false;
  const now = Date.now();
  const exception = session.overrideExceptions.find((e) => e.domain === domain);
  return !exception || exception.expiresAt <= now;
}

function createBanner(session: ActiveSession, domain: string): void {
  if (banner) return;

  const el = document.createElement('div');
  el.id = 'flowdesk-blocker-banner';
  el.innerHTML = `
    <div class="fd-banner-inner">
      <span class="fd-icon">&#x1F6AB;</span>
      <span class="fd-text">
        <strong>FlowDesk</strong> is blocking <strong>${domain}</strong> — stay in the zone
      </span>
      <button class="fd-override-btn" id="fd-override-btn">
        Override (5 min)
        ${session.overridesLeft > 0 ? `<span class="fd-overrides-left">${session.overridesLeft} left</span>` : '<span class="fd-overrides-left fd-none">none left</span>'}
      </button>
    </div>
  `;

  document.body.appendChild(el);
  banner = el;

  const btn = document.getElementById('fd-override-btn');
  if (btn) {
    btn.addEventListener('click', handleOverride);
    if (session.overridesLeft <= 0) {
      (btn as HTMLButtonElement).disabled = true;
    }
  }
}

function removeBanner(): void {
  if (banner) {
    banner.remove();
    banner = null;
  }
}

function handleOverride(): void {
  if (!currentSession) return;
  if (currentSession.overridesLeft <= 0) return;
  if (isDemoMode) {
    removeBanner();
    return;
  }

  const domain = getCurrentDomain();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const updated: ActiveSession = {
    ...currentSession,
    overridesLeft: currentSession.overridesLeft - 1,
    overrideExceptions: [
      ...currentSession.overrideExceptions.filter((e) => e.domain !== domain),
      { domain, expiresAt },
    ],
  };

  chrome.storage.local.set({ activeSession: updated });
  removeBanner();

  // Re-check after override expires
  setTimeout(() => {
    chrome.storage.local.get('activeSession', (data: StorageData) => {
      const s = data.activeSession;
      if (s && isDomainBlocked(s, domain)) {
        currentSession = s;
        createBanner(s, domain);
      }
    });
  }, 5 * 60 * 1000 + 500);
}

function handleSessionChange(session: ActiveSession | undefined): void {
  if (!session) {
    currentSession = null;
    removeBanner();
    return;
  }

  currentSession = session;
  const domain = getCurrentDomain();
  const now = Date.now();

  if (session.endsAt <= now) {
    removeBanner();
    return;
  }

  if (isDomainBlocked(session, domain)) {
    createBanner(session, domain);
  } else {
    removeBanner();
  }
}

if (isDemoMode) {
  // Demo mode: show banner after 3s with current domain as "blocked"
  setTimeout(() => {
    const domain = getCurrentDomain();
    const demoSession: ActiveSession = {
      taskId: 'demo-task',
      taskTitle: 'Demo Focus Session',
      endsAt: Date.now() + 25 * 60 * 1000,
      blockedDomains: [domain],
      overridesLeft: 2,
      overrideExceptions: [],
    };
    currentSession = demoSession;
    createBanner(demoSession, domain);
  }, 3000);
} else {
  chrome.storage.local.get('activeSession', (data: StorageData) => {
    handleSessionChange(data.activeSession);
  });

  chrome.storage.onChanged.addListener(
    (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area !== 'local' || !changes['activeSession']) return;
      handleSessionChange(changes['activeSession'].newValue as ActiveSession | undefined);
    },
  );
}
