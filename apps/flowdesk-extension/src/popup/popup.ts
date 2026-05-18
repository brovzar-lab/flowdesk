import type { ActiveSession, FlowdeskSettings, StorageData } from '../shared/types';

function formatTimeLeft(endsAt: number): string {
  const ms = Math.max(0, endsAt - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderActive(session: ActiveSession): void {
  const root = document.getElementById('app')!;
  root.innerHTML = `
    <div class="header">
      <span class="dot dot-active"></span>
      <span class="label">Focus Session Active</span>
    </div>
    <div class="task-title">${session.taskTitle}</div>
    <div class="timer" id="timer">${formatTimeLeft(session.endsAt)}</div>
    <div class="section-label">Blocked domains</div>
    <ul class="domain-list" id="domain-list">
      ${session.blockedDomains
        .map((d) => {
          const exc = session.overrideExceptions.find((e) => e.domain === d);
          const overridden = exc && exc.expiresAt > Date.now();
          return `<li class="domain-item${overridden ? ' overridden' : ''}">
            <span class="domain-name">${d}</span>
            ${overridden ? '<span class="override-badge">override active</span>' : ''}
          </li>`;
        })
        .join('')}
    </ul>
    <div class="overrides-row">
      <span class="overrides-label">Overrides remaining</span>
      <span class="overrides-count">${session.overridesLeft}</span>
    </div>
  `;

  const timerEl = document.getElementById('timer');
  if (timerEl && session.endsAt > Date.now()) {
    const interval = setInterval(() => {
      if (session.endsAt <= Date.now()) {
        clearInterval(interval);
        renderIdle();
        return;
      }
      timerEl.textContent = formatTimeLeft(session.endsAt);
    }, 1000);
  }
}

function renderIdle(settings?: FlowdeskSettings): void {
  const root = document.getElementById('app')!;
  const focusOn = settings?.focusMode ?? false;
  const blockedSites = settings?.blockedSites ?? [];

  root.innerHTML = `
    <div class="header">
      <span class="dot ${focusOn ? 'dot-active' : 'dot-idle'}"></span>
      <span class="label">${focusOn ? 'Focus Mode Active' : 'No active session'}</span>
    </div>
    <div class="focus-row">
      <span class="focus-label">Focus Mode</span>
      <button class="toggle-btn ${focusOn ? 'toggle-on' : 'toggle-off'}" id="focus-toggle">
        ${focusOn ? 'ON' : 'OFF'}
      </button>
    </div>
    ${
      blockedSites.length > 0
        ? `<div class="section-label">Blocked sites</div>
           <ul class="domain-list">
             ${blockedSites
               .map(
                 (d) => `<li class="domain-item"><span class="domain-name">${d}</span></li>`,
               )
               .join('')}
           </ul>`
        : ''
    }
    <p class="idle-msg">Start a Cockpit session in FlowDesk to activate focus blocking.</p>
    <a class="open-link" id="open-flowdesk" href="#">Open FlowDesk</a>
  `;

  document.getElementById('open-flowdesk')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://flowdesk.vercel.app' });
  });

  document.getElementById('focus-toggle')?.addEventListener('click', () => {
    const updated: FlowdeskSettings = {
      userId: settings?.userId ?? '',
      focusMode: !focusOn,
      blockedSites: settings?.blockedSites ?? [],
    };
    chrome.storage.local.set({ flowdeskSettings: updated });
  });
}

chrome.storage.local.get(['activeSession', 'flowdeskSettings'], (data: StorageData) => {
  if (data.activeSession && data.activeSession.endsAt > Date.now()) {
    renderActive(data.activeSession);
  } else {
    renderIdle(data.flowdeskSettings);
  }
});

chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== 'local') return;
    if (!changes['activeSession'] && !changes['flowdeskSettings']) return;

    chrome.storage.local.get(['activeSession', 'flowdeskSettings'], (data: StorageData) => {
      const session = data.activeSession;
      if (session && session.endsAt > Date.now()) {
        renderActive(session);
      } else {
        renderIdle(data.flowdeskSettings);
      }
    });
  },
);
