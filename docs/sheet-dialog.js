// Presentation-only behavior. Building selection and data remain in app.js.
const sheet = document.getElementById('buildingSheet');
const panel = sheet.querySelector('.sheetPanel');
const close = document.getElementById('closeSheet');
let previousFocus = null;
let wasOpen = false;
const background = [...document.querySelectorAll('#scanner > :not(#buildingSheet)')];

function syncDialog() {
  const isOpen = !sheet.classList.contains('hidden');
  if (isOpen === wasOpen) return;
  wasOpen = isOpen;
  for (const element of background) element.inert = isOpen;
  if (isOpen) {
    previousFocus = document.activeElement;
    panel.scrollTop = 0;
    for (const details of panel.querySelectorAll('details')) details.open = false;
    close.focus({ preventScroll: true });
  } else if (previousFocus?.isConnected) {
    previousFocus.focus({ preventScroll: true });
  }
}

sheet.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    close.click();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...panel.querySelectorAll('button, a[href], summary, input, [tabindex="0"]')]
    .filter(element => !element.disabled && element.getClientRects().length > 0);
  const first = focusable[0], last = focusable.at(-1);
  if (!first) { event.preventDefault(); panel.focus(); return; }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});
new MutationObserver(syncDialog).observe(sheet, { attributes: true, attributeFilter: ['class'] });
syncDialog();
