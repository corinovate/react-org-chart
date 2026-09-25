import { renderEmployeePrintHtml } from '../core/print.js';
import type { DrawerField, Employee } from '../core/types.js';

/**
 * Resolves once every <img> in `doc` has either loaded or failed — a same-document iframe's
 * print() doesn't wait for in-flight network requests on its own, so calling it right after
 * doc.write() can silently omit a photo that hadn't finished downloading yet. Capped by
 * `timeoutMs` so one slow/unreachable image can never block printing indefinitely.
 */
function waitForImages(doc: Document, timeoutMs = 3000): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();

  const settled = Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          }),
    ),
  ).then(() => undefined);

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([settled, timeout]);
}

/**
 * Prints a single person's details via a hidden same-document <iframe>, not
 * `window.open()+print()`: popup windows are blocked unless opened synchronously
 * in the click handler, and iOS Safari specifically blocks automatic printing in
 * a newly opened window. The iframe has none of those restrictions and still
 * isolates print CSS from the host app's stylesheet.
 */
export function printEmployeeWeb(person: Employee, fields: DrawerField[]): void {
  const html = renderEmployeePrintHtml(person, fields);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };
  iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
  // Generous fallback: covers the up-to-3s image wait below plus normal print-dialog
  // interaction time, in case 'afterprint' never fires (some browsers/edge cases).
  setTimeout(cleanup, 8000);

  waitForImages(doc).then(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  });
}
