import { useRef, useEffect } from 'react';

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function TabBar({ tabs, active, onChange }: Props) {
  const barRef  = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [active]);

  return (
    <div
      ref={barRef}
      style={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        padding: '0 16px',
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        position: 'sticky',
        top: 52,
        zIndex: 100,
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--c-blue-dk)' : 'var(--c-text2)',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--c-blue-dk)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? 'var(--c-blue-dk)' : 'var(--c-text3)',
                background: isActive ? 'var(--c-blue-bg)' : 'var(--c-surface2)',
                borderRadius: 10,
                padding: '1px 6px',
                lineHeight: 1.5,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
