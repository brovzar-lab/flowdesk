import type { ActiveSession, FlowdeskSettings, StorageData } from '../shared/types';

const RULE_BASE_ID = 1000;
const FOCUS_RULE_BASE_ID = 2000;

chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== 'local') return;

    if (changes['activeSession']) {
      const session = changes['activeSession'].newValue as ActiveSession | undefined;
      if (session) {
        updateSessionRules(session);
      } else {
        clearSessionRules();
      }
    }

    if (changes['flowdeskSettings']) {
      const settings = changes['flowdeskSettings'].newValue as FlowdeskSettings | undefined;
      if (settings?.focusMode) {
        updateFocusModeRules(settings.blockedSites);
      } else {
        clearFocusModeRules();
      }
    }
  },
);

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === 'session-end') {
    chrome.storage.local.remove('activeSession');
    clearSessionRules();
    return;
  }

  if (alarm.name.startsWith('override-')) {
    const domain = alarm.name.slice('override-'.length);
    chrome.storage.local.get('activeSession', (data: StorageData) => {
      const session = data.activeSession;
      if (!session) return;

      const updated: ActiveSession = {
        ...session,
        overrideExceptions: session.overrideExceptions.filter((e) => e.domain !== domain),
      };
      chrome.storage.local.set({ activeSession: updated });
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['activeSession', 'flowdeskSettings'], (data: StorageData) => {
    if (data.activeSession && data.activeSession.endsAt > Date.now()) {
      updateSessionRules(data.activeSession);
    } else if (data.flowdeskSettings?.focusMode) {
      updateFocusModeRules(data.flowdeskSettings.blockedSites);
    }
  });
});

function getActiveDomains(session: ActiveSession): string[] {
  const now = Date.now();
  return session.blockedDomains.filter((domain) => {
    const exception = session.overrideExceptions.find((e) => e.domain === domain);
    return !exception || exception.expiresAt <= now;
  });
}

function buildRules(
  domains: string[],
  baseId: number,
): chrome.declarativeNetRequest.Rule[] {
  return domains.map((domain, i) => ({
    id: baseId + i,
    priority: 1,
    action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
      ],
    },
  }));
}

function updateSessionRules(session: ActiveSession): void {
  const activeDomains = getActiveDomains(session);
  const addRules = buildRules(activeDomains, RULE_BASE_ID);

  chrome.declarativeNetRequest.getDynamicRules((existing) => {
    const sessionRuleIds = existing
      .map((r) => r.id)
      .filter((id) => id >= RULE_BASE_ID && id < FOCUS_RULE_BASE_ID);

    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: sessionRuleIds, addRules },
      () => {
        const now = Date.now();
        const minutesLeft = Math.max(0.1, (session.endsAt - now) / 60000);
        chrome.alarms.create('session-end', { delayInMinutes: minutesLeft });
      },
    );
  });
}

function clearSessionRules(): void {
  chrome.declarativeNetRequest.getDynamicRules((existing) => {
    const sessionRuleIds = existing
      .map((r) => r.id)
      .filter((id) => id >= RULE_BASE_ID && id < FOCUS_RULE_BASE_ID);

    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: sessionRuleIds, addRules: [] },
      () => {
        chrome.alarms.clear('session-end');
      },
    );
  });
}

function updateFocusModeRules(blockedSites: string[]): void {
  const addRules = buildRules(blockedSites, FOCUS_RULE_BASE_ID);

  chrome.declarativeNetRequest.getDynamicRules((existing) => {
    const focusRuleIds = existing.map((r) => r.id).filter((id) => id >= FOCUS_RULE_BASE_ID);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: focusRuleIds,
      addRules,
    });
  });
}

function clearFocusModeRules(): void {
  chrome.declarativeNetRequest.getDynamicRules((existing) => {
    const focusRuleIds = existing.map((r) => r.id).filter((id) => id >= FOCUS_RULE_BASE_ID);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: focusRuleIds,
      addRules: [],
    });
  });
}
