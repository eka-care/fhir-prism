/**
 * parser.js
 * Parses a FHIR Bundle JSON string and populates the shared state.
 * Depends on: constants.js, state.js, helpers.js, ui.js (for showToast / setStatusIndicator).
 */

/**
 * Inspects the loaded Composition resource to determine the ABDM document type,
 * then updates `currentDocType` in state.
 *
 * Detection order:
 *   1. Profile URL substring match
 *   2. Composition title keywords
 *   3. Resource types present in the bundle
 */
function detectDocumentType() {
  const compositions = resourceMap['Composition'] || [];
  if (!compositions.length) return;

  const composition = compositions[0];

  const profileUrls = composition.meta?.profile || [];

  // 0. Detect IPS (International Patient Summary) first
  const isIPS = profileUrls.some(url =>
    url.toLowerCase().includes('ips') ||
    url.includes('PatientSummary') ||
    url.includes('patient-summary')
  ) || (composition.type?.coding || []).some(c => c.code === '60591-5');
  if (isIPS) { currentDocType = ABDM_DOC_TYPES.PatientSummary; return; }

  // 1. Match profile URL against known ABDM type keys
  for (const profileUrl of profileUrls) {
    for (const [typeKey, typeConfig] of Object.entries(ABDM_DOC_TYPES)) {
      if (profileUrl.includes(typeKey)) {
        currentDocType = typeConfig;
        return;
      }
    }
  }

  // 2. Match Composition title keywords
  const titleLower = (composition.title || '').toLowerCase();
  if (titleLower.includes('invoice'))                                        { currentDocType = ABDM_DOC_TYPES.InvoiceRecord;          return; }
  if (titleLower.includes('discharge'))                                      { currentDocType = ABDM_DOC_TYPES.DischargeSummaryRecord;  return; }
  if (titleLower.includes('prescription') || titleLower.includes('medication')) { currentDocType = ABDM_DOC_TYPES.PrescriptionRecord;  return; }
  if (titleLower.includes('lab') || titleLower.includes('diagnostic') || titleLower.includes('report')) { currentDocType = ABDM_DOC_TYPES.DiagnosticReportRecord; return; }
  if (titleLower.includes('immunization') || titleLower.includes('vaccination')) { currentDocType = ABDM_DOC_TYPES.ImmunizationRecord; return; }
  if (titleLower.includes('wellness'))                                       { currentDocType = ABDM_DOC_TYPES.WellnessRecord;          return; }
  if (titleLower.includes('opd') || titleLower.includes('consultation') || titleLower.includes('consult')) { currentDocType = ABDM_DOC_TYPES.OPConsultRecord; return; }

  // 3. Infer from resource types present in the bundle
  if (resourceMap['Invoice'])                                                          { currentDocType = ABDM_DOC_TYPES.InvoiceRecord;          return; }
  if (resourceMap['Immunization'])                                                     { currentDocType = ABDM_DOC_TYPES.ImmunizationRecord;      return; }
  if ((resourceMap['Observation'] || []).some(obs => isLabObservation(obs)))          { currentDocType = ABDM_DOC_TYPES.DiagnosticReportRecord;  return; }
  if (resourceMap['MedicationRequest'])                                                { currentDocType = ABDM_DOC_TYPES.PrescriptionRecord;      return; }
}

/**
 * Parses a raw JSON string as a FHIR Bundle (or single resource wrapped in one),
 * populates `resourceMap` and `rawBundle` in state, then triggers record rendering.
 *
 * @param {string} jsonText - Raw JSON string from file input or paste area.
 */
function parseBundle(jsonText) {
  let bundle;
  try {
    bundle = JSON.parse(jsonText);
  } catch (parseError) {
    showToast('Invalid JSON: ' + parseError.message);
    return;
  }

  if (!bundle.resourceType) {
    showToast('Not a FHIR resource');
    return;
  }

  // Wrap a single (non-Bundle) resource in a minimal collection bundle
  if (bundle.resourceType !== 'Bundle') {
    bundle = { resourceType: 'Bundle', type: 'collection', entry: [{ resource: bundle }] };
  }

  rawBundle = bundle;
  resourceMap = {};

  // Populate resourceMap, deduplicating by resourceType + id
  const seenResourceIds = new Set();
  (bundle.entry || []).forEach(entry => {
    const resource = entry.resource;
    if (!resource?.resourceType) return;

    if (!resourceMap[resource.resourceType]) resourceMap[resource.resourceType] = [];

    const uniqueId = resource.resourceType + '/' + (resource.id || Math.random());
    if (seenResourceIds.has(uniqueId)) return;
    seenResourceIds.add(uniqueId);

    resourceMap[resource.resourceType].push(resource);
  });

  const totalEntries  = (bundle.entry || []).length;
  const resourceTypes = Object.keys(resourceMap).join(' · ');
  setStatusIndicator('ok', `${totalEntries} resources · ${resourceTypes}`);

  const patients = resourceMap['Patient'] || [];
  if (!patients.length) {
    showToast('No Patient resource found');
    return;
  }

  detectDocumentType();
  renderRecord(patients[0]);
}
