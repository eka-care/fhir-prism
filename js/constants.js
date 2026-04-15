/**
 * constants.js
 * All static lookup tables and configuration for the FHIR viewer.
 */

/**
 * ABDM / NDHM document type definitions.
 * Keys match profile URL substrings or title keywords used during detection.
 *
 * Each entry describes:
 *   name   – Human-readable document type label
 *   icon   – Emoji used in the document banner
 *   color  – CSS class for the icon background (icon-*)
 *   tag    – CSS class for the pill tag (tag-*)
 *   desc   – Short description shown under the title
 */
const ABDM_DOC_TYPES = {
  InvoiceRecord:          { name: 'OPD Invoice',          icon: '🧾', color: 'icon-teal',   tag: 'tag-teal',   desc: 'Billing & charges' },
  OPConsultRecord:        { name: 'OPD Consultation',     icon: '🩺', color: 'icon-blue',   tag: 'tag-blue',   desc: 'Outpatient visit' },
  OPDConsult:             { name: 'OPD Consultation',     icon: '🩺', color: 'icon-blue',   tag: 'tag-blue',   desc: 'Outpatient visit' },
  DischargeSummary:       { name: 'Discharge Summary',    icon: '🏥', color: 'icon-purple', tag: 'tag-purple', desc: 'Inpatient discharge' },
  DischargeSummaryRecord: { name: 'Discharge Summary',    icon: '🏥', color: 'icon-purple', tag: 'tag-purple', desc: 'Inpatient discharge' },
  DiagnosticReport:       { name: 'Diagnostic Report',    icon: '🔬', color: 'icon-amber',  tag: 'tag-amber',  desc: 'Lab / radiology' },
  DiagnosticReportRecord: { name: 'Diagnostic Report',    icon: '🔬', color: 'icon-amber',  tag: 'tag-amber',  desc: 'Lab / radiology' },
  PrescriptionRecord:     { name: 'Prescription',         icon: '💊', color: 'icon-green',  tag: 'tag-green',  desc: 'Medications prescribed' },
  ImmunizationRecord:     { name: 'Immunization Record',  icon: '💉', color: 'icon-coral',  tag: 'tag-coral',  desc: 'Vaccination history' },
  WellnessRecord:         { name: 'Wellness Record',      icon: '❤️', color: 'icon-red',    tag: 'tag-red',    desc: 'Wellness & lifestyle' },
  HealthDocumentRecord:   { name: 'Health Document',      icon: '📋', color: 'icon-gray',   tag: 'tag-gray',   desc: 'General health record' },
  PatientSummary:         { name: 'Patient Summary (IPS)', icon: '🌐', color: 'icon-purple', tag: 'tag-purple', desc: 'International Patient Summary' },
};

/**
 * Reference ranges for common vital signs.
 * Used to flag high / low readings without an interpretation code.
 */
const VITAL_REFERENCE_RANGES = {
  'heart rate':       { low: 60,   high: 100  },
  'pulse rate':       { low: 60,   high: 100  },
  'oxygen saturation':{ low: 95              },
  'spo2':             { low: 95              },
  'blood glucose':    {            high: 140  },
  'glucose':          {            high: 140  },
  'body temperature': { low: 97,   high: 99.5 },
  'temperature':      { low: 97,   high: 99.5 },
  'respiratory rate': { low: 12,   high: 20   },
  'bmi':              { low: 18.5, high: 30   },
};

/**
 * LOINC codes that identify vital-sign observations.
 */
const VITAL_LOINC_CODES = new Set([
  '8867-4',   // Heart rate
  '59408-5',  // SpO2
  '8310-5',   // Body temperature
  '29463-7',  // Body weight
  '8302-2',   // Body height
  '39156-5',  // BMI
  '2339-0',   // Blood glucose
  '8480-6',   // Systolic BP
  '8462-4',   // Diastolic BP
  '55284-4',  // Blood pressure panel
  '9279-1',   // Respiratory rate
  '85354-9',  // BP panel (FHIR)
  '72514-3',  // Pain severity
  '15074-8',  // Glucose [moles/volume]
]);

/**
 * FHIR category codes that identify lab observations.
 */
const LAB_OBSERVATION_CATEGORIES = new Set([
  'laboratory', 'lab', 'LAB', 'Laboratory',
]);

/**
 * Mapping of key vital-sign LOINC codes to display config.
 * Used to build the "Key Vitals" section in the overview tab.
 */
const KEY_VITAL_CODE_MAP = {
  '55284-4': { label: 'Blood pressure',    unit: 'mmHg' },
  '8867-4':  { label: 'Heart rate',        unit: 'bpm',  low: 60,   high: 100  },
  '59408-5': { label: 'SpO₂',              unit: '%',    low: 95                },
  '8310-5':  { label: 'Temperature',       unit: '°F',   low: 97,   high: 99.5 },
  '29463-7': { label: 'Weight',            unit: 'kg'  },
  '2339-0':  { label: 'Blood glucose',     unit: 'mg/dL',            high: 140  },
  '39156-5': { label: 'BMI',               unit: 'kg/m²',low: 18.5, high: 30   },
  '9279-1':  { label: 'Respiratory rate',  unit: 'bpm',  low: 12,   high: 20   },
};

/**
 * IPS Composition section LOINC codes → display config.
 * Used by renderIPSSummaryTab to label and style each section.
 */
const IPS_SECTION_LOINC = {
  '11450-4': { title: 'Problem List',             icon: '🩺', color: 'icon-red'    },
  '48765-2': { title: 'Allergies & Intolerances', icon: '⚠️', color: 'icon-amber'  },
  '10160-0': { title: 'Medication Summary',       icon: '💊', color: 'icon-green'  },
  '11369-6': { title: 'Immunizations',            icon: '💉', color: 'icon-coral'  },
  '30954-2': { title: 'Diagnostic Results',       icon: '🔬', color: 'icon-amber'  },
  '47519-4': { title: 'History of Procedures',    icon: '⚕',  color: 'icon-teal'   },
  '46264-8': { title: 'Medical Devices',          icon: '🩻', color: 'icon-blue'   },
  '42348-3': { title: 'Advance Directives',       icon: '📜', color: 'icon-gray'   },
  '74728-7': { title: 'Functional Status',        icon: '🏃', color: 'icon-blue'   },
  '11348-0': { title: 'History of Past Problems', icon: '📋', color: 'icon-gray'   },
  '10162-6': { title: 'Pregnancy History',        icon: '🤱', color: 'icon-coral'  },
  '29762-2': { title: 'Social History',           icon: '👤', color: 'icon-gray'   },
  '8716-3':  { title: 'Vital Signs',              icon: '❤️', color: 'icon-red'    },
  '18776-5': { title: 'Plan of Care',             icon: '🎯', color: 'icon-purple' },
  '48768-6': { title: 'Alerts',                   icon: '🔔', color: 'icon-amber'  },
};

/**
 * Default document type used before detection runs.
 */
const DEFAULT_DOC_TYPE = { name: 'FHIR Document', icon: '📄', color: 'icon-blue', tag: 'tag-blue', desc: 'FHIR document' };
