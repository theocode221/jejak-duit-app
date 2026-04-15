/**
 * Enter on a text-like input or select moves focus to the next tabbable control
 * in the same scope (nearest form, else main content, else top bar).
 * Last field in a <form> submits via requestSubmit().
 * Opt out: data-no-enter-next on an element or ancestor.
 */

const MAIN_SCOPE = 'main.app-shell__content';
const TOPBAR_SCOPE = 'header.app-topbar';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(',');

function isTextLikeInput(el: HTMLInputElement): boolean {
  const t = (el.type || 'text').toLowerCase();
  switch (t) {
    case 'checkbox':
    case 'radio':
    case 'button':
    case 'submit':
    case 'reset':
    case 'file':
    case 'hidden':
    case 'image':
      return false;
    default:
      return true;
  }
}

function triggersEnterNext(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('[data-no-enter-next]')) return false;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLTextAreaElement) return false;
  if (target instanceof HTMLInputElement) return isTextLikeInput(target);
  return false;
}

function focusScope(el: HTMLElement): Element | null {
  const form = el.closest('form');
  if (form) return form;
  const main = el.closest(MAIN_SCOPE);
  if (main) return main;
  return el.closest(TOPBAR_SCOPE);
}

function collectFocusables(scope: Element): HTMLElement[] {
  const list: HTMLElement[] = [];
  for (const el of scope.querySelectorAll(FOCUSABLE_SELECTOR)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.tabIndex < 0) continue;
    if (el.matches(':disabled')) continue;
    if (el instanceof HTMLInputElement && el.type === 'hidden') continue;
    list.push(el);
  }
  return list;
}

function onKeyDownCapture(e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.defaultPrevented) return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.isComposing) return;

  const target = e.target;
  if (!triggersEnterNext(target)) return;

  const scope = focusScope(target);
  if (!scope) return;

  const focusables = collectFocusables(scope);
  if (focusables.length === 0) return;

  const active = document.activeElement;
  const idx =
    active instanceof HTMLElement ? focusables.indexOf(active) : -1;
  if (idx < 0) return;

  e.preventDefault();

  const next = focusables[idx + 1];
  if (next) {
    next.focus();
    return;
  }

  if (scope instanceof HTMLFormElement) {
    scope.requestSubmit();
  }
}

export function installEnterKeyFocusNext(): () => void {
  document.addEventListener('keydown', onKeyDownCapture, true);
  return () =>
    document.removeEventListener('keydown', onKeyDownCapture, true);
}
