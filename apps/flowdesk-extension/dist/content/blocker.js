// FlowDesk Focus Blocker — content script
// Compiled from src/content/blocker.ts
(() => {
  const isDemoMode =
    typeof chrome === "undefined" || !chrome?.storage;

  let banner = null;
  let currentSession = null;

  function getCurrentDomain() {
    return window.location.hostname.replace(/^www\./, "");
  }

  function isDomainBlocked(session, domain) {
    if (!session.blockedDomains.includes(domain)) return false;
    const now = Date.now();
    const exception = session.overrideExceptions.find(
      (e) => e.domain === domain
    );
    return !exception || exception.expiresAt <= now;
  }

  function createBanner(session, domain) {
    if (banner) return;
    const el = document.createElement("div");
    el.id = "flowdesk-blocker-banner";
    el.innerHTML = `
      <div class="fd-banner-inner">
        <span class="fd-icon">&#x1F6AB;</span>
        <span class="fd-text">
          <strong>FlowDesk</strong> is blocking <strong>${domain}</strong> — stay in the zone
        </span>
        <button class="fd-override-btn" id="fd-override-btn">
          Override (5 min)
          ${
            session.overridesLeft > 0
              ? `<span class="fd-overrides-left">${session.overridesLeft} left</span>`
              : '<span class="fd-overrides-left fd-none">none left</span>'
          }
        </button>
      </div>
    `;
    document.body.appendChild(el);
    banner = el;
    const btn = document.getElementById("fd-override-btn");
    if (btn) {
      btn.addEventListener("click", handleOverride);
      if (session.overridesLeft <= 0) {
        btn.disabled = true;
      }
    }
  }

  function removeBanner() {
    if (banner) {
      banner.remove();
      banner = null;
    }
  }

  function handleOverride() {
    if (!currentSession) return;
    if (currentSession.overridesLeft <= 0) return;
    if (isDemoMode) {
      removeBanner();
      return;
    }
    const domain = getCurrentDomain();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const updated = {
      ...currentSession,
      overridesLeft: currentSession.overridesLeft - 1,
      overrideExceptions: [
        ...currentSession.overrideExceptions.filter((e) => e.domain !== domain),
        { domain, expiresAt },
      ],
    };
    chrome.storage.local.set({ activeSession: updated });
    removeBanner();
    setTimeout(() => {
      chrome.storage.local.get("activeSession", (data) => {
        const s = data.activeSession;
        if (s && isDomainBlocked(s, domain)) {
          currentSession = s;
          createBanner(s, domain);
        }
      });
    }, 5 * 60 * 1000 + 500);
  }

  function handleSessionChange(session) {
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
    setTimeout(() => {
      const domain = getCurrentDomain();
      const demoSession = {
        taskId: "demo-task",
        taskTitle: "Demo Focus Session",
        endsAt: Date.now() + 25 * 60 * 1000,
        blockedDomains: [domain],
        overridesLeft: 2,
        overrideExceptions: [],
      };
      currentSession = demoSession;
      createBanner(demoSession, domain);
    }, 3e3);
  } else {
    chrome.storage.local.get("activeSession", (data) => {
      handleSessionChange(data.activeSession);
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes["activeSession"]) return;
      handleSessionChange(changes["activeSession"].newValue);
    });
  }
})();
