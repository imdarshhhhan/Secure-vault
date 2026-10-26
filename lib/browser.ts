import type { BackgroundMessage } from './messages';

/**
 * Everything that touches chrome.* APIs other than storage lives here, with a harmless
 * fallback when the UI runs in a normal tab under `next dev`.
 */

export function isExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

async function sendToBackground(message: BackgroundMessage): Promise<void> {
  if (!isExtension()) return;
  try {
    await chrome.runtime.sendMessage(message);
  } catch {
    // Best effort: the service worker may be waking up. The in-page timer is the first line of defence.
  }
}

export const scheduleAutoLock = (minutes: number) => sendToBackground({ type: 'schedule-autolock', minutes });
export const cancelAutoLock = () => sendToBackground({ type: 'cancel-autolock' });

/**
 * The address of the tab the user is looking at.
 * With the "activeTab" permission, Chrome only reveals it at the moment the user clicks our toolbar icon,
 * and only for that one tab. We use it to pick matching logins and never store or send it anywhere.
 */
export async function getActiveTabUrl(): Promise<string | null> {
  if (isExtension() && chrome.tabs) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url ?? null;
  }
  // Dev preview only: http://localhost:3000/popup?url=https://github.com/login
  return new URLSearchParams(window.location.search).get('url');
}

export function openFullApp(): void {
  if (isExtension()) void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  else window.open('/', '_blank');
}

/**
 * Copies text (call this directly from a click handler) and, if asked, schedules a best-effort
 * clipboard wipe. Browsers and operating systems may not always allow the wipe, so this is a
 * safety net, not a guarantee.
 */
export async function copyToClipboard(text: string, clearAfterSeconds: number): Promise<void> {
  await navigator.clipboard.writeText(text);
  if (clearAfterSeconds <= 0) return;
  if (isExtension()) {
    await sendToBackground({ type: 'schedule-clipboard-clear', seconds: clearAfterSeconds });
  } else {
    setTimeout(() => void navigator.clipboard.writeText(' ').catch(() => {}), clearAfterSeconds * 1000);
  }
}
