import type { DrawerField, Employee } from './types.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function defaultFieldValue(person: Employee, field: DrawerField): string {
  if (field.render) return field.render(person);
  const value = (person as unknown as Record<string, unknown>)[field.key] ?? person.customFields?.[field.key];
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Builds a fully self-contained HTML document (inline <style>, no external
 * stylesheet/font/image-host references) describing a single person, for
 * printing. Self-contained is required, not optional: the web renderer feeds
 * this into a hidden same-document <iframe> whose document does not inherit
 * anything from the host page's <head>, and the native renderer feeds the
 * same string into expo-print, which has no access to the host app's assets.
 */
export function renderEmployeePrintHtml(person: Employee, fields: DrawerField[]): string {
  const rows = fields
    .map((field) => {
      const value = defaultFieldValue(person, field);
      if (!value) return '';
      return `<tr><th>${escapeHtml(field.label)}</th><td>${escapeHtml(value)}</td></tr>`;
    })
    .filter(Boolean)
    .join('\n');

  const photo = person.photoUrl
    ? `<img src="${escapeHtml(person.photoUrl)}" alt="${escapeHtml(person.name)}" />`
    : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(person.name)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    padding: 32px;
    max-width: 480px;
    margin: 0 auto;
  }
  h1 { font-size: 22px; margin: 16px 0 4px; }
  img {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
  th { color: #666; font-weight: 500; width: 40%; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  ${photo}
  <h1>${escapeHtml(person.name)}</h1>
  <table>
    ${rows}
  </table>
</body>
</html>`;
}
