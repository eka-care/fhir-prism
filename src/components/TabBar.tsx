import { useRef, useEffect } from "react";

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
  const barRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [active]);

  return (
    <div
      ref={barRef}
      className="prism-flex prism-overflow-x-auto prism-py-0 prism-p-x-16 
      prism-sticky prism-top-52 
      prism-z-100 prism-gap-2 
      "
      style={{
        borderBottom: "1px solid var(--c-border)",
        background: "var(--c-surface)",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onChange(tab.id)}
            className="prism-flex prism-items-center prism-gap-5 prism-cursor-pointer 
            prism-flex-shrink-0 prism-border-none prism-py-10 prism-px-14 -prism-mb-1 prism-bg-none prism-whitespace-nowrap"
            
            style={{
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--c-blue-dk)" : "var(--c-text2)",

              borderBottom: isActive
                ? "2px solid var(--c-blue-dk)"
                : "2px solid transparent",

              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isActive ? "var(--c-blue-dk)" : "var(--c-text3)",
                  background: isActive
                    ? "var(--c-blue-bg)"
                    : "var(--c-surface2)",
                  borderRadius: 10,
                  padding: "1px 6px",
                  lineHeight: 1.5,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
