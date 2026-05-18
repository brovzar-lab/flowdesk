import type { ActiveSession, StorageData } from '../shared/types';

const RULE_BASE_ID = 1000;

chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== 'local') return;
    if (!changes['activeSession']) return;

    const session = changes['activeSession'].newValue as ActiveSession | undefined;
    if (session) {
      updateBlockingRules(session);
    } else {
      clearBlockingRules();
    }
  },
);

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === 'session-end') {
    chrome.storage.local.remove('activeSession');
    clearBlockingRules();
    return;
  }

  if (alarm.name.startsWith('override-')) {
    const domain = alarm.name.slice('override-'.length);
    chrome.storage.local.get('activeSession', (data: StorageData) => {
      const session = data.activeSession;
      if (!session) return;

      const updated: ActiveSession = {
        ...session,
        overrideExceptions: session.overrideExceptions.filter(
          (e) => e.domain !== domain,
        ),
      };
      chrome.storage.local.set({ activeSession: updated });
    });
  }
});

function getActiveDomains(session: ActiveSession): string[] {
  const now = Date.now();
  return session.blockedDomains.filter((domain) => {
    const exception = session.overrideExceptions.find((e) => e.domain === domain);
    return !exception || exception.expiresAt <= now;
  });
}

function updateBlockingRules(session: ActiveSession): void {
  chrome.declarativeNetRequest.getDynamicRules((existing) => {
    const removeIds = existing.map((r) => r.id);
    const activeDomains = getActiveDomains(session);

    const addRules: chrome.declarativeNetRequest.Rule[] = activeDomains.map(
      (domain, i) => ({
        id: RULE_BASE_ID + i,
        priority: 1,
        action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          ],
        },
      }),
    );

    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: removeIds, addRules },
      () => {
        const now = Date.now();
        const minutesLeft = Math.max(0.1, (session.endsAt - now) / 60000);
        chrome.alarms.create('session-end', { delayInMinutes: minutesLeft });
      },
    );
  });
}

function clearBlockingRules(): void {
  chrome.declarativeNetRequest.getDynamicRules((existing) => {
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: existing.map((r) => r.id), addRules: [] },
      () => {
        chrome.alarms.clear('session-end');
      },
    );
  });
}
