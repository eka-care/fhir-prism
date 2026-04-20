import { useState } from "react";
import { useFhir } from "../../context/FhirContext";

export function RawJsonTab() {
  const { rawBundle } = useFhir();
  const [copied, setCopied] = useState(false);

  if (!rawBundle)
    return <div className="empty-state">No raw data available.</div>;

  const json = JSON.stringify(rawBundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}
      >
        <button
          className="
        hover:prism-bg-bg-doc/10
          active:prism-scale-95
          prism-bg-transparent prism-h-36 prism-px-8
           prism-text-content-secondary
           prism-border-1
           prism-border-bg-seperator-dark
          prism-inline-flex prism-items-center prism-gap-6 prism-shrink-0 prism-whitespace-nowrap prism-rounded-7 prism-text-13 
          prism-font-500 prism-cursor-pointer prism-transition-all prism-duration-150
          "
          onClick={handleCopy}
        >
          {copied ? "✓ Copied" : "⎘ Copy JSON"}
        </button>
      </div>
      <pre
        className="prism-rounded-12"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          padding: 16,
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--c-text)",
          fontFamily: "var(--font-mono)",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: "70vh",
          overflow: "auto",
        }}
      >
        {json}
      </pre>
    </div>
  );
}
