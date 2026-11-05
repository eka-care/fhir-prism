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
      <div style={{ textAlign: 'center', margin: '20px 0 28px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--eka-rose-ink)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          ABDM · FHIR R4
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, color: 'var(--c-text)' }}>
          Read any health record, <span style={{ color: 'var(--c-blue)' }}>instantly</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--c-text2)', marginTop: 8 }}>
          Drop an ABDM FHIR bundle to see the patient, encounters, medications and reports in one view.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--c-blue)' : '#B8CBFF'}`,
          borderRadius: 16,
          boxShadow: '0 4px 18px rgba(33,95,255,.10)',
          padding: '52px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'var(--c-blue-bg)' : 'linear-gradient(120deg, #E8F0FF 0%, #fff 80%)',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 12, background: 'var(--eka-grad-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(177,74,224,.25)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 17v-6" /><path d="m9 14 3-3 3 3" />
          </svg>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 5 }}>Drop a FHIR Bundle JSON here</h3>
        <p style={{ fontSize: 13, color: 'var(--c-text2)' }}>or click to browse · Supports all ABDM / NDHM document types</p>
        <div className="prism-flex prism-flex-wrap prism-justify-center prism-gap-6 prism-mt-14">
          {DOC_TYPE_CHIPS.map(chip => (
            <span
              key={chip}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text2)',
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
          border: '1px solid var(--c-border)',
          background: 'var(--c-surface)', color: 'var(--c-text)',
          outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--c-blue)')}
        onBlur={e => (e.target.style.borderColor = 'var(--c-border)')}
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
