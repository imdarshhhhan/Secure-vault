import type { BackgroundMessage } from './messages';


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

export async function getActiveTabUrl(): Promise<string | null> {
  if (isExtension() && chrome.tabs) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url ?? null;
  }
  return new URLSearchParams(window.location.search).get('url');
}

export function openFullApp(): void {
  if (isExtension()) void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  else window.open('/', '_blank');
}


export async function copyToClipboard(text: string, clearAfterSeconds: number): Promise<void> {
  await navigator.clipboard.writeText(text);
  if (clearAfterSeconds <= 0) return;
  if (isExtension()) {
    await sendToBackground({ type: 'schedule-clipboard-clear', seconds: clearAfterSeconds });
  } else {
    setTimeout(() => void navigator.clipboard.writeText(' ').catch(() => {}), clearAfterSeconds * 1000);
  }
}
