# FHIR Prism

A lightweight, browser-based viewer for FHIR (Fast Healthcare Interoperability Resources) Bundle documents — purpose-built for India's **ABDM / NDHM** (Ayushman Bharat Digital Mission / National Digital Health Mission) ecosystem.

---

## What problem does this solve?

FHIR bundles are the canonical exchange format for clinical documents in ABDM. They are structured JSON, which means they are machine-readable but not human-friendly. Clinicians and developers alike need a way to quickly inspect what is inside a document — patient demographics, diagnoses, medications, lab results, imaging attachments, and more — without writing custom parsing code every time.

**FHIR Prism** solves this by:

- Accepting any FHIR R4 Bundle (pasted or dropped as a file)
- Auto-detecting the document type (OPD Consultation, Discharge Summary, Prescription, Lab Report, etc.)
- Presenting the clinical content across purpose-built tabs — no raw JSON required
- Running entirely in the browser with no backend, no data upload, no server

---

## Features

- **Zero-backend** — all parsing happens client-side; patient data never leaves the browser
- **Auto document-type detection** — identifies ABDM document profiles from resource structure, LOINC codes, and section titles
- **22 clinical tabs** covering the full breadth of a FHIR bundle:
  - Overview, IPS Summary, Encounters, Conditions, Medications, Observations, Reports, Allergies, Immunizations, Procedures, Family History, Orders, Billing, Documents, Care Plan, Coverage, Devices, Alerts, Directives, Functional Status, All Resources, Raw JSON
- **International Patient Summary (IPS)** support
- **Embedded media viewer** — renders PDFs and images attached inside the bundle
- **ABDM / NDHM compliant profiles** — understands India-specific document structures

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 3.4 (custom `prism-` prefix) |
| State | Zustand 5 |
| PDF rendering | PDF.js 3 |
| Linting | ESLint 9 + typescript-eslint |

---

## Getting started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server (HTTPS on port 5174)
npm run dev
# → https://localhost:5174/fhir-prism/

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

The dev server uses a self-signed certificate (`@vitejs/plugin-basic-ssl`). Accept the browser warning on first load.

---

## How to use

1. Open the app in your browser.
2. Either **paste** a FHIR JSON bundle into the text area or **drag-and-drop** a `.json` file.
3. The document type is detected automatically and the relevant tabs are shown.
4. Navigate tabs to explore patient demographics, clinical data, and embedded documents.
5. Use the **Raw JSON** tab to inspect the unmodified bundle at any time.

---

## Project structure

```
src/
├── components/
│   ├── tabs/           # One component per clinical tab (22 tabs)
│   ├── RecordView.tsx  # Main view shell (tab bar + active tab)
│   ├── UploadPanel.tsx # Paste / drag-drop entry point
│   ├── PatientHeader.tsx
│   ├── DocumentBanner.tsx
│   └── ...
├── store/
│   └── fhirStore.ts    # Zustand store — parsed resource map, doc type, UI state
├── lib/
│   ├── parser.ts       # FHIR bundle parsing & document type detection
│   ├── types.ts        # TypeScript types for 40+ FHIR resource kinds
│   ├── helpers.ts      # Name / date / code extraction utilities
│   └── constants.ts    # Document type definitions, vital & LOINC code maps
└── tailwind-theme-config/
    └── ...             # Custom design tokens
```

---

## Supported document types

| ABDM Document Type | Detection method |
|---|---|
| OPD Consultation Record | Profile URL / section LOINC |
| Discharge Summary | Profile URL / section LOINC |
| Prescription | Profile URL / MedicationRequest presence |
| Diagnostic Report — Lab | Profile URL / DiagnosticReport category |
| Diagnostic Report — Radiology | Profile URL / DiagnosticReport category |
| Health Document Record | Profile URL |
| Wellness Record | Profile URL |
| International Patient Summary | Profile URL |

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a pull request

---

## License

[MIT](LICENSE)
