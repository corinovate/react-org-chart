import React, { useState } from 'react';

export interface EmptyStateProps {
  editable: boolean;
  onAddFirstPerson: (name: string) => void;
}

export function EmptyState({ editable, onAddFirstPerson }: EmptyStateProps) {
  const [name, setName] = useState('');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--oc-background)',
      }}
    >
      <div
        style={{
          background: 'var(--oc-card-bg-hover)',
          border: '1px solid var(--oc-card-border)',
          borderRadius: 16,
          boxShadow: 'var(--oc-card-shadow)',
          padding: 32,
          maxWidth: 320,
          textAlign: 'center',
          fontFamily: 'var(--oc-font-family)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--oc-text-primary)' }}>
          Start your org chart
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--oc-text-secondary)' }}>
          {editable ? 'Add the first person to begin.' : 'No one has been added to this chart yet.'}
        </p>
        {editable && (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && onAddFirstPerson(name.trim())}
              placeholder="Full name"
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--oc-card-border)',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => name.trim() && onAddFirstPerson(name.trim())}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--oc-text-primary)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                opacity: name.trim() ? 1 : 0.5,
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
