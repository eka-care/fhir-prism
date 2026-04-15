/**
 * state.js
 * Shared mutable application state for the FHIR viewer.
 *
 * All modules read and write these variables directly.
 * Keep business logic out of this file — it holds data only.
 */

/**
 * Parsed resource map: { ResourceType: Resource[] }
 * Populated by parseBundle(). Deduplicated by resource id.
 * Example: { Patient: [...], Condition: [...], MedicationRequest: [...] }
 */
let resourceMap = {};

/**
 * The raw FHIR Bundle object last parsed, used for the Raw JSON tab.
 */
let rawBundle = null;

/**
 * Tab definitions built by buildTabs(), each entry is:
 *   { id, label, fn, _rendered }
 * Stored so switchTab() can lazy-render a tab on first open.
 */
let activeTabs = [];

/**
 * Detected document type for the currently loaded bundle.
 * Defaults to DEFAULT_DOC_TYPE (from constants.js) until detectDocumentType() runs.
 */
let currentDocType = { ...DEFAULT_DOC_TYPE };
