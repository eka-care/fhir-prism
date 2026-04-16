import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { useFhirStore } from '../store/fhirStore';

const DOC_TYPE_CHIPS = [
  'OPD Consultation', 'Discharge Summary', 'Lab Report',
  'Prescription', 'Immunization', 'Invoice', 'Wellness Record', 'Health Document',
];

export function UploadPanel() {
  const { loadJson, pasteText, setPasteText } = useFhirStore();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => loadJson(e.target?.result as string);
    reader.readAsText(file);
  }

  function onDragOver(e: DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) readFile(e.target.files[0]);
  }

  return (
    <div className="prism-max-w-[720px] prism-mx-auto prism-py-24">
      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--c-blue)' : 'var(--c-border2)'}`,
          borderRadius: 'var(--radius)',
          padding: '52px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'var(--c-blue-bg)' : 'var(--c-surface)',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>📄</div>
        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 5 }}>Drop a FHIR Bundle JSON here</h3>
        <p style={{ fontSize: 13, color: 'var(--c-text2)' }}>or click to browse · Supports all ABDM / NDHM document types</p>
        <div className="prism-flex prism-flex-wrap prism-justify-center prism-gap-6 prism-mt-14">
          {DOC_TYPE_CHIPS.map(chip => (
            <span
              key={chip}
              style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 10,
                background: 'var(--c-surface2)', border: '0.5px solid var(--c-border2)', color: 'var(--c-text2)',
              }}
            >{chip}</span>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      {/* Or divider */}
      <div
        className="prism-flex prism-items-center prism-gap-10 prism-my-16"
        style={{ color: 'var(--c-text3)', fontSize: 12 }}
      >
        <div style={{ flex: 1, height: '0.5px', background: 'var(--c-border2)' }} />
        or paste JSON
        <div style={{ flex: 1, height: '0.5px', background: 'var(--c-border2)' }} />
      </div>

      {/* Paste area */}
      <textarea
        value={pasteText}
        onChange={e => setPasteText(e.target.value)}
        placeholder='{"resourceType":"Bundle","type":"document","entry":[...]}'
        style={{
          width: '100%', height: 100, resize: 'vertical',
          fontFamily: 'var(--font-mono)', fontSize: 12,
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          border: '0.5px solid var(--c-border2)',
          background: 'var(--c-surface2)', color: 'var(--c-text)',
          outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--c-blue)')}
        onBlur={e => (e.target.style.borderColor = 'var(--c-border2)')}
      />

      <div className="prism-flex prism-gap-8 prism-mt-10 prism-items-center">
        <button
          className="btn btn-primary"
          onClick={() => { if (pasteText.trim()) loadJson(pasteText.trim()); }}
        >
          Parse &amp; view
        </button>
        <span style={{ fontSize: 12, color: 'var(--c-text2)' }}>R4 · eka.care · HAPI · any NDHM-conformant bundle</span>
      </div>
    </div>
  );
}
