# FlowDesk Focus Blocker — Chrome Extension

Blocks distracting websites during your FlowDesk Cockpit focus sessions.

## How It Works

1. You start a Cockpit session in the FlowDesk web app
2. The web app writes session state to `chrome.storage.local`
3. The extension's service worker picks up the change and adds `declarativeNetRequest` blocking rules
4. If you navigate to a blocked domain, the content script shows a banner
5. You can override the block for 5 minutes (max 2 overrides per session)
6. When the session ends, all blocking rules are cleared

## Building

```bash
npm install
npm run build
```

Output goes to `dist/`. The build also copies `popup.html` and `blocker.css` into `dist/`.

## Installing (Load Unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `apps/flowdesk-extension/` folder (the root that contains `manifest.json`)
5. The extension icon appears in your toolbar

> The extension reads from the `dist/` folder. Run `npm run build` before loading.

## Zipping for Chrome Web Store

```bash
npm run zip
```

Produces `flowdesk-extension.zip` in the `apps/flowdesk-extension/` directory.

## Demo Mode

If the extension is loaded in a context where `chrome.storage` is unavailable, the content script falls back to demo mode: it shows a blocking banner after 3 seconds on any page, with no real network blocking.

## Storage Schema

The web app writes to `chrome.storage.local`:

```ts
interface ActiveSession {
  taskId: string;
  taskTitle: string;
  endsAt: number;           // Unix timestamp (ms)
  blockedDomains: string[]; // e.g. ['twitter.com', 'reddit.com']
  overridesLeft: number;    // starts at 2
  overrideExceptions: Array<{ domain: string; expiresAt: number }>;
}
```

## Files

| File | Purpose |
|------|---------|
| `src/background/service-worker.ts` | Manages `declarativeNetRequest` rules on storage change |
| `src/content/blocker.ts` | Injected into pages — shows/hides the blocking banner |
| `src/content/blocker.css` | Banner styles |
| `src/popup/popup.html` | Extension popup UI |
| `src/popup/popup.ts` | Popup logic — shows session status and blocked domains |
| `src/shared/types.ts` | Shared TypeScript interfaces |
