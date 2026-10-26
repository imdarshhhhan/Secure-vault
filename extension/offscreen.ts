const box = document.createElement('textarea');
box.value = ' ';
document.body.appendChild(box);
box.select();
document.execCommand('copy');
box.remove();
void chrome.runtime.sendMessage({ type: 'offscreen-done' });
