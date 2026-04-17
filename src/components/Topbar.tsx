import { useFhir } from '../context/FhirContext';

export function Topbar() {
  const { status } = useFhir();

  const dotColor =
    status.type === 'ok'      ? 'var(--c-green)' :
    status.type === 'err'     ? 'var(--c-red)' :
    status.type === 'loading' ? 'var(--c-amber)' :
    'var(--c-text3)';

  return (
    <div
      className="prism-sticky prism-top-0 prism-z-[200] prism-flex prism-items-center prism-gap-14 prism-px-24"
      style={{ background: 'var(--c-surface)', borderBottom: '0.5px solid var(--c-border2)', height: 52 }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.4px', flexShrink: 0 }}>
        ABDM <span style={{ color: 'var(--c-blue)' }}>FHIR</span>{' '}
        <sub style={{ fontSize: 9, fontWeight: 400, color: 'var(--c-text3)', verticalAlign: 'middle', marginLeft: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Viewer</sub>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: dotColor, flexShrink: 0,
          transition: 'background 0.3s',
          animation: status.type === 'loading' ? 'blink 1s infinite' : undefined,
        }}
      />
      <div style={{ fontSize: 12, color: 'var(--c-text2)', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {status.text}
      </div>
    </div>
  );
}
