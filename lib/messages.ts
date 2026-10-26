export type BackgroundMessage =
  | { type: 'schedule-autolock'; minutes: number }
  | { type: 'cancel-autolock' }
  | { type: 'schedule-clipboard-clear'; seconds: number }
  | { type: 'offscreen-done' };

export const ALARM_AUTOLOCK = 'securevault-autolock';
export const ALARM_CLIPBOARD = 'securevault-clipboard-clear';
