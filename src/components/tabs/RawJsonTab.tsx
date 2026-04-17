import { useState } from 'react';
import { useFhir } from '../../context/FhirContext';

export function RawJsonTab() {
  const { rawBundle } = useFhir();
  const [copied, setCopied] = useState(false);

  if (!rawBundle) return <div className="empty-state">No raw data available.</div>;

  const json = JSON.stringify(rawBundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-secondary" onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy JSON'}
        </button>
      </div>
      <pre style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        fontSize: 12,
        lineHeight: 1.6,
        color: 'var(--c-text)',
        fontFamily: 'var(--font-mono)',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '70vh',
        overflow: 'auto',
      }}>
        {json}
      </pre>
    </div>
  );
}
