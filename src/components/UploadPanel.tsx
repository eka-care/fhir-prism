import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useFhirStore } from "../store/fhirStore";

const DOC_TYPE_CHIPS = [
  "OPD Consultation",
  "Discharge Summary",
  "Lab Report",
  "Prescription",
  "Immunization",
  "Invoice",
  "Wellness Record",
  "Health Document",
];

export function UploadPanel() {
  const { loadJson, pasteText, setPasteText } = useFhirStore();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => loadJson(e.target?.result as string);
    reader.readAsText(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() {
    setDragging(false);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) readFile(e.target.files[0]);
  }

  return (
    <div className="prism-max-w-720 prism-mx-auto prism-py-24">
      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`prism-rounded-12 prism-cursor-pointer prism-px-52 prism-py-24 prism-text-center prism-border-dashed
          ${
            dragging
              ? "prism-border-2  prism-border-text-primary-dark prism-bg-text-primary-dark/20"
              : "prism-border-2 prism-border-border-neutral prism-bg-surface-base prism-transition-colors prism-duration-200"
          }`}
      >
        <div className="prism-text-32 prism-mb-10 prism-opacity-60">📄</div>
        <h3 className="prism-text-16 prism-mb-5 prism-font-500">
          Drop a FHIR Bundle JSON here
        </h3>
        <p className="prism-text-13 prism-text-content-secondary">
          or click to browse · Supports all ABDM / NDHM document types
        </p>
        <div className="prism-flex prism-flex-wrap prism-justify-center prism-gap-6 prism-mt-14">
          {DOC_TYPE_CHIPS.map((chip) => (
            <span
              key={chip}
              className="prism-text-11 prism-px-9 prism-py-3 prism-rounded-10 prism-bg-surface-muted prism-text-content-secondary prism-border-border-03 "
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <input
        className="prism-hidden"
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onFileChange}
      />

      {/* Or divider */}
      <div className="prism-flex prism-items-center prism-gap-10 prism-my-16 prism-text-content-secondary prism-text-12">
        <div className="prism-flex-1 prism-h-1 prism-bg-surface-muted" />
        or paste JSON
        <div className="prism-flex-1 prism-h-1 prism-bg-surface-muted" />
      </div>

      {/* Paste area */}
      <textarea
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        placeholder='{"resourceType":"Bundle","type":"document","entry":[...]}'
        className="focus:prism-border-border-doc/20 prism-rounded-7 prism-w-full prism-h-100 
        prism-outline-0 prism-text-12 prism-px-12 prism-py-10 prism-resize-y prism-bg-surface-base prism-border-1 prism-border-surface-muted prism-text-content-secondary"
      />

      <div className="prism-flex prism-gap-8 prism-mt-10 prism-items-center">
        <button
          className="
          hover:prism-opacity-85
          active:prism-scale-95
          prism-bg-bg-doc prism-h-36 prism-px-8 prism-text-text-invert
          prism-inline-flex prism-items-center prism-gap-6 prism-shrink-0 prism-whitespace-nowrap prism-rounded-7 prism-text-13 
          prism-font-500 prism-cursor-pointer prism-transition-all prism-duration-150"
          onClick={() => {
            if (pasteText.trim()) loadJson(pasteText.trim());
          }}
        >
          Parse &amp; view
        </button>
        <span className="prism-text-content-secondary prism-text-12">
          R4 · eka.care · HAPI · any NDHM-conformant bundle
        </span>
      </div>
    </div>
  );
}
