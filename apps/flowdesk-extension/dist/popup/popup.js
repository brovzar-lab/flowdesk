// FlowDesk Focus Blocker — popup script
// Compiled from src/popup/popup.ts
(() => {
  function formatTimeLeft(endsAt) {
    const ms = Math.max(0, endsAt - Date.now());
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderActive(session) {
    const root = document.getElementById("app");
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
            return `<li class="domain-item${overridden ? " overridden" : ""}">
              <span class="domain-name">${d}</span>
              ${overridden ? '<span class="override-badge">override active</span>' : ""}
            </li>`;
          })
          .join("")}
      </ul>
      <div class="overrides-row">
        <span class="overrides-label">Overrides remaining</span>
        <span class="overrides-count">${session.overridesLeft}</span>
      </div>
    `;

    const timerEl = document.getElementById("timer");
    if (timerEl && session.endsAt > Date.now()) {
      const interval = setInterval(() => {
        if (session.endsAt <= Date.now()) {
          clearInterval(interval);
          renderIdle();
          return;
        }
        timerEl.textContent = formatTimeLeft(session.endsAt);
      }, 1e3);
    }
  }

  function renderIdle() {
    const root = document.getElementById("app");
    root.innerHTML = `
      <div class="header">
        <span class="dot dot-idle"></span>
        <span class="label">No active session</span>
      </div>
      <p class="idle-msg">Start a Cockpit session in FlowDesk to activate focus blocking.</p>
      <a class="open-link" id="open-flowdesk" href="#">Open FlowDesk</a>
    `;
    document.getElementById("open-flowdesk")?.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "https://flowdesk.vercel.app" });
    });
  }

  chrome.storage.local.get("activeSession", (data) => {
    if (data.activeSession && data.activeSession.endsAt > Date.now()) {
      renderActive(data.activeSession);
    } else {
      renderIdle();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes["activeSession"]) return;
    const session = changes["activeSession"].newValue;
    if (session && session.endsAt > Date.now()) {
      renderActive(session);
    } else {
      renderIdle();
    }
  });
})();
