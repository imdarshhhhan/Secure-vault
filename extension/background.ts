import { ALARM_AUTOLOCK, ALARM_CLIPBOARD } from '../lib/messages';
import type { BackgroundMessage } from '../lib/messages';
import { clearSessionKey } from '../lib/storage';

/**
 * Background service worker. It holds NO secrets and never sees your passwords.
 * Its only jobs are timers that must keep working after the popup closes:
 *   1. auto-lock: delete the unlock key from session storage when the inactivity timer fires
 *   2. clipboard: overwrite the clipboard a little while after a password was copied
 */

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  // Only accept messages from this extension's own pages (there are no content scripts).
  if (sender.id !== chrome.runtime.id) return false;

  switch (message.type) {
    case 'schedule-autolock':
      void chrome.alarms.create(ALARM_AUTOLOCK, { delayInMinutes: Math.max(1, Number(message.minutes) || 1) });
      break;
    case 'cancel-autolock':
      void chrome.alarms.clear(ALARM_AUTOLOCK);
      break;
    case 'schedule-clipboard-clear':
      // Chrome's alarm timer can't fire faster than ~30 seconds.
      void chrome.alarms.create(ALARM_CLIPBOARD, { when: Date.now() + Math.max(30, Number(message.seconds) || 30) * 1000 });
      break;
    case 'offscreen-done':
      void chrome.offscreen.closeDocument().catch(() => {});
      break;
  }
  sendResponse({ ok: true });
  return false;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_AUTOLOCK) void clearSessionKey();
  if (alarm.name === ALARM_CLIPBOARD) void clearClipboard();
});

// A service worker has no clipboard access, so a tiny hidden page (offscreen.html) does the wipe.
async function clearClipboard(): Promise<void> {
  const existing = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT] });
  if (existing.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: 'Clear a copied password from the clipboard after the chosen delay.',
  });
}
