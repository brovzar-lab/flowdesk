// FlowDesk Focus Blocker — service worker
// Compiled from src/background/service-worker.ts
(() => {
  const RULE_BASE_ID = 1000;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (!changes["activeSession"]) return;
    const session = changes["activeSession"].newValue;
    if (session) {
      updateBlockingRules(session);
    } else {
      clearBlockingRules();
    }
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "session-end") {
      chrome.storage.local.remove("activeSession");
      clearBlockingRules();
      return;
    }
    if (alarm.name.startsWith("override-")) {
      const domain = alarm.name.slice("override-".length);
      chrome.storage.local.get("activeSession", (data) => {
        const session = data.activeSession;
        if (!session) return;
        const updated = {
          ...session,
          overrideExceptions: session.overrideExceptions.filter(
            (e) => e.domain !== domain
          ),
        };
        chrome.storage.local.set({ activeSession: updated });
      });
    }
  });

  function getActiveDomains(session) {
    const now = Date.now();
    return session.blockedDomains.filter((domain) => {
      const exception = session.overrideExceptions.find(
        (e) => e.domain === domain
      );
      return !exception || exception.expiresAt <= now;
    });
  }

  function updateBlockingRules(session) {
    chrome.declarativeNetRequest.getDynamicRules((existing) => {
      const removeIds = existing.map((r) => r.id);
      const activeDomains = getActiveDomains(session);
      const addRules = activeDomains.map((domain, i) => ({
        id: RULE_BASE_ID + i,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ["main_frame", "sub_frame"],
        },
      }));
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: removeIds, addRules },
        () => {
          const now = Date.now();
          const minutesLeft = Math.max(0.1, (session.endsAt - now) / 60000);
          chrome.alarms.create("session-end", {
            delayInMinutes: minutesLeft,
          });
        }
      );
    });
  }

  function clearBlockingRules() {
    chrome.declarativeNetRequest.getDynamicRules((existing) => {
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds: existing.map((r) => r.id), addRules: [] },
        () => {
          chrome.alarms.clear("session-end");
        }
      );
    });
  }
})();
