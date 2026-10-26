// Runs inside the hidden offscreen page: replaces the clipboard contents with a single space.
const box = document.createElement('textarea');
box.value = ' ';
document.body.appendChild(box);
box.select();
document.execCommand('copy');
box.remove();
void chrome.runtime.sendMessage({ type: 'offscreen-done' });
