import { renderEmployeePrintHtml } from '../core/print.js';
import type { DrawerField, Employee } from '../core/types.js';

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
  setTimeout(cleanup, 5000);

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
}
