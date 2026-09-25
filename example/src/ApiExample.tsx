import React, { useEffect, useState } from 'react';
import { OrgChart } from 'core-innovate-tree/react';
import { flattenTree } from 'core-innovate-tree';
import type { NestedEmployee, OrgChartData } from 'core-innovate-tree';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: OrgChartData };

/**
 * Demonstrates the widget fed from an actual async source instead of hardcoded JSON: a
 * `fetch()` call against a JSON endpoint, converted with `flattenTree` because — like most
 * real org-chart APIs — this one returns a nested `{ ...fields, children: [...] }` tree
 * rather than the flat `{ id, managerId }` shape the widget itself works with.
 *
 * `/org-chart.json` here is a static file (see example/public/org-chart.json) standing in for
 * a real endpoint; swap the `fetch` URL for your own API and the rest of this component is
 * the pattern to copy.
 */
export function ApiExample() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    fetch('/org-chart.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((nested: NestedEmployee) => {
        if (cancelled) return;
        setState({ status: 'ready', data: flattenTree(nested) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <CenteredMessage>Loading org chart…</CenteredMessage>;
  }
  if (state.status === 'error') {
    return <CenteredMessage>Failed to load: {state.message}</CenteredMessage>;
  }

  return (
    <OrgChart
      data={state.data}
      onChange={(next) => setState({ status: 'ready', data: next })}
      editable
      printable
      drawerFields={[
        { key: 'title', label: 'Title' },
        { key: 'department', label: 'Department' },
      ]}
    />
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#7a7266',
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}
