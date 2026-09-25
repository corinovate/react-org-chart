import { describe, expect, it } from 'vitest';
import { renderEmployeePrintHtml } from './print.js';

describe('renderEmployeePrintHtml', () => {
  it('produces a self-contained document with no external references', () => {
    const html = renderEmployeePrintHtml(
      { id: 'alice', name: 'Alice <Test>', title: 'CEO' },
      [{ key: 'title', label: 'Title' }],
    );
    expect(html).toContain('<style>');
    expect(html).not.toMatch(/<link/);
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).toContain('Alice &lt;Test&gt;');
    expect(html).toContain('CEO');
  });

  it('omits fields with no value and supports a custom render function', () => {
    const html = renderEmployeePrintHtml({ id: 'bob', name: 'Bob' }, [
      { key: 'department', label: 'Department' },
      { key: 'name', label: 'Full name', render: (p) => `Mr. ${p.name}` },
    ]);
    expect(html).not.toContain('Department');
    expect(html).toContain('Mr. Bob');
  });
});
