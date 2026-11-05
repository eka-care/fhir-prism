import { useFhir } from '../context/FhirContext';

const EKA_LOGO = `${import.meta.env.BASE_URL}eka-logo.svg`;

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
      style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', height: 52 }}
    >
      <a href="https://www.eka.care" target="_blank" rel="noreferrer" style={{ display: 'flex', flexShrink: 0 }}>
        <img src={EKA_LOGO} alt="Eka Care" style={{ height: 26, display: 'block' }} />
      </a>
      <div style={{ width: 1, height: 22, background: 'var(--c-border)', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)' }}>FHIR Viewer</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>ABDM health records</span>
      </div>
      <div style={{ flex: 1 }} />
      <div
        className="prism-flex prism-items-center prism-gap-8"
        style={{ border: '1px solid var(--c-border)', borderRadius: 999, padding: '5px 12px', background: 'var(--c-surface2)', minWidth: 0 }}
      >
        <div
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: dotColor, flexShrink: 0,
            transition: 'background 0.3s',
            animation: status.type === 'loading' ? 'blink 1s infinite' : undefined,
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text2)', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {status.text}
        </div>
      </div>
    </div>
  );
}
