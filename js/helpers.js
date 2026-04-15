/**
 * helpers.js
 * Pure utility functions for extracting and formatting FHIR resource data.
 * No DOM manipulation. No side effects. Depends on: constants.js, state.js.
 */

// ─── Patient helpers ───────────────────────────────────────────────────────

/** Returns the display name for a Patient resource. */
function getPatientName(patient) {
  if (!patient.name?.length) {
    return patient.text?.div ? stripHtml(patient.text.div) : 'Unknown';
  }
  const nameEntry = patient.name[0];
  return (
    nameEntry.text ||
    [nameEntry.prefix?.[0], ...(nameEntry.given || []), nameEntry.family]
      .filter(Boolean)
      .join(' ') ||
    'Unknown'
  );
}

/** Returns up to two initials from a patient's display name. */
function getPatientInitials(patient) {
  return getPatientName(patient)
    .replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}

/** Returns the Medical Record Number (MRN) or falls back to resource id. */
function getPatientMRN(patient) {
  if (!patient.identifier) return patient.id || '—';
  const mrnIdentifier = patient.identifier.find(
    ident =>
      (ident.type?.coding || []).some(c => c.code === 'MR') ||
      (ident.system || '').toLowerCase().includes('mrn')
  );
  return mrnIdentifier?.value || patient.identifier[0]?.value || patient.id || '—';
}

/** Calculates age in years from an ISO date-of-birth string. */
function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

// ─── Practitioner helpers ──────────────────────────────────────────────────

/** Returns the display name for a Practitioner resource. */
function getPractitionerName(practitioner) {
  if (!practitioner.name?.length) return 'Practitioner';
  const nameEntry = practitioner.name[0];
  return (
    nameEntry.text ||
    [nameEntry.prefix?.[0], ...(nameEntry.given || []), nameEntry.family]
      .filter(Boolean)
      .join(' ') ||
    'Practitioner'
  );
}

// ─── Medication helpers ────────────────────────────────────────────────────

/** Returns the medication name from a MedicationRequest or MedicationStatement. */
function getMedicationName(medicationRequest) {
  return (
    medicationRequest.medicationCodeableConcept?.text ||
    (medicationRequest.medicationCodeableConcept?.coding || [])[0]?.display ||
    medicationRequest.medicationReference?.display ||
    medicationRequest.medication?.concept?.text ||
    'Unknown medication'
  );
}

// ─── Condition helpers ─────────────────────────────────────────────────────

/** Returns the human-readable label for a Condition resource. */
function getConditionLabel(condition) {
  return (
    condition.code?.text ||
    (condition.code?.coding || [])[0]?.display ||
    'Unknown condition'
  );
}

// ─── Observation helpers ───────────────────────────────────────────────────

/** Returns the primary value of an Observation as a string. */
function getObservationValue(observation) {
  if (observation.valueQuantity != null)    return observation.valueQuantity.value?.toString() || '—';
  if (observation.valueString)              return observation.valueString;
  if (observation.valueCodeableConcept)     return observation.valueCodeableConcept.text || (observation.valueCodeableConcept.coding || [])[0]?.display || '—';
  if (observation.valueBoolean != null)     return observation.valueBoolean ? 'Yes' : 'No';
  if (observation.valueInteger != null)     return observation.valueInteger.toString();
  if (observation.component)               return observation.component.map(c => c.valueQuantity?.value).filter(Boolean).join('/');
  return '—';
}

/**
 * Resolves a FHIR reference string to the actual resource in resourceMap.
 * Handles both "ResourceType/id" and "urn:uuid:..." formats.
 *
 * @param {string} reference - e.g. "Condition/abc123" or "urn:uuid:abc123"
 * @returns {Object|null} The matched resource, or null if not found.
 */
function resolveReference(reference) {
  if (!reference) return null;

  // "ResourceType/id" format
  const slashIdx = reference.indexOf('/');
  if (slashIdx !== -1 && !reference.startsWith('urn:')) {
    const type = reference.substring(0, slashIdx);
    const id   = reference.substring(slashIdx + 1);
    const found = (resourceMap[type] || []).find(r => r.id === id);
    if (found) return found;
  }

  // "urn:uuid:..." format — match by resource.id or bundle entry fullUrl
  const uuidPart = reference.startsWith('urn:uuid:') ? reference.slice(9) : null;
  if (uuidPart) {
    for (const resources of Object.values(resourceMap)) {
      const found = resources.find(r => r.id === uuidPart);
      if (found) return found;
    }
  }

  // Fallback: search bundle entries by fullUrl
  for (const entry of (rawBundle?.entry || [])) {
    if (entry.fullUrl === reference && entry.resource) return entry.resource;
  }

  return null;
}

/** Returns the value of a single Observation component as a string. */
function getComponentValue(comp) {
  if (comp.valueQuantity != null)     return `${comp.valueQuantity.value ?? '—'} ${comp.valueQuantity.unit || ''}`.trim();
  if (comp.valueString)               return comp.valueString;
  if (comp.valueCodeableConcept)      return comp.valueCodeableConcept.text || (comp.valueCodeableConcept.coding || [])[0]?.display || '—';
  if (comp.valueBoolean != null)      return comp.valueBoolean ? 'Yes' : 'No';
  if (comp.valueInteger != null)      return comp.valueInteger.toString();
  return '—';
}

/** Returns the reference range of an Observation as a formatted string. */
function getObservationReferenceRange(observation) {
  if (!observation.referenceRange?.length) return '—';
  const range = observation.referenceRange[0];
  if (range.text)                                         return range.text;
  if (range.low?.value != null && range.high?.value != null) return `${range.low.value}–${range.high.value}`;
  if (range.high?.value != null)                          return `< ${range.high.value}`;
  if (range.low?.value != null)                           return `> ${range.low.value}`;
  return '—';
}

/** Returns whether an Observation is a vital-sign reading. */
function isVitalObservation(observation) {
  const categoryValues = (observation.category || [])
    .flatMap(cat => cat.coding || [])
    .map(c => c.code || '')
    .concat((observation.category || []).map(cat => cat.text || ''));

  if (categoryValues.some(c => c.toLowerCase().includes('vital'))) return true;

  const loincCodes = (observation.code?.coding || []).map(c => c.code);
  return loincCodes.some(code => VITAL_LOINC_CODES.has(code));
}

/** Returns whether an Observation is a lab result. */
function isLabObservation(observation) {
  const categoryValues = (observation.category || [])
    .flatMap(cat => cat.coding || [])
    .map(c => c.code || '')
    .concat((observation.category || []).map(cat => cat.text || ''));

  return categoryValues.some(
    c => LAB_OBSERVATION_CATEGORIES.has(c) || c.toLowerCase().includes('lab')
  );
}

/**
 * Collects key vitals from the current resourceMap for the overview panel.
 * Returns an array of { label, value, unit, isHigh, isLow } objects.
 */
function getKeyVitals() {
  const observations = resourceMap['Observation'] || [];
  const seenCodes = new Set();
  const results = [];

  observations.forEach(obs => {
    const matchedCoding = (obs.code?.coding || []).find(c => KEY_VITAL_CODE_MAP[c.code]);
    if (!matchedCoding || seenCodes.has(matchedCoding.code)) return;

    seenCodes.add(matchedCoding.code);
    const config = KEY_VITAL_CODE_MAP[matchedCoding.code];

    let value = obs.component
      ? obs.component.map(c => c.valueQuantity?.value?.toFixed(0)).filter(Boolean).join('/')
      : obs.valueQuantity?.value != null
        ? obs.valueQuantity.value
        : getObservationValue(obs);

    const numericValue = parseFloat(value);
    results.push({
      label:  config.label,
      value:  String(value),
      unit:   config.unit,
      isHigh: !!(config.high && numericValue > config.high),
      isLow:  !!(config.low  && numericValue < config.low),
    });
  });

  return results;
}

// ─── Status / style helpers ────────────────────────────────────────────────

/** Returns CSS icon + tag classes for a Condition clinical status. */
function getConditionStatusStyle(status) {
  if (status === 'active')                                    return { iconClass: 'icon-red',   tagClass: 'tag-red'   };
  if (['resolved', 'inactive', 'remission'].includes(status)) return { iconClass: 'icon-gray',  tagClass: 'tag-gray'  };
  return { iconClass: 'icon-amber', tagClass: 'tag-amber' };
}

/** Returns CSS icon + tag classes for a MedicationRequest status. */
function getMedicationStatusStyle(status) {
  if (['active', 'on-hold'].includes(status))                   return { iconClass: 'icon-green', tagClass: 'tag-green' };
  if (['stopped', 'cancelled', 'completed'].includes(status))   return { iconClass: 'icon-gray',  tagClass: 'tag-gray'  };
  return { iconClass: 'icon-blue', tagClass: 'tag-blue' };
}

/** Returns CSS icon + tag classes for an AllergyIntolerance severity. */
function getAllergyStatusStyle(severity) {
  if (['severe', 'high'].includes(severity))  return { iconClass: 'icon-red',   tagClass: 'tag-red'   };
  if (['moderate'].includes(severity))        return { iconClass: 'icon-amber', tagClass: 'tag-amber' };
  return { iconClass: 'icon-gray', tagClass: 'tag-gray' };
}

// ─── All Resources tab helper ──────────────────────────────────────────────

/**
 * Returns a generic display object { title, sub, tag, tagClass } for any resource type.
 * Used by the "All Resources" tab to render a summary row for each resource.
 */
function getResourceDisplayInfo(resource) {
  const resourceType = resource.resourceType;

  const defaultDisplay = () => {
    const skipKeys = new Set(['resourceType', 'id', 'text', 'meta', 'extension', '_id']);
    const sub = Object.entries(resource)
      .filter(([key]) => !skipKeys.has(key))
      .slice(0, 3)
      .map(([key, val]) => `${key}: ${JSON.stringify(val).slice(0, 50)}`)
      .join(' · ');
    return { title: resource.id || resourceType, sub, tag: null, tagClass: '' };
  };

  switch (resourceType) {
    case 'Patient':
      return { title: getPatientName(resource), sub: `${resource.gender || ''} · DOB: ${resource.birthDate || '—'} · MRN: ${getPatientMRN(resource)}`, tag: capitalizeFirst(resource.gender || ''), tagClass: 'tag-blue' };
    case 'Practitioner':
      return { title: getPractitionerName(resource), sub: (resource.qualification || []).map(q => q.code?.text).filter(Boolean).join(', ') || resource.id || '', tag: null, tagClass: '' };
    case 'Organization':
      return { title: resource.name || 'Organization', sub: (resource.address || []).map(a => [a.city, a.state].filter(Boolean).join(', ')).join(' · ') || resource.id || '', tag: null, tagClass: '' };
    case 'Encounter':
      return { title: (resource.type || []).map(t => t.text || (t.coding || [])[0]?.display).filter(Boolean).join(', ') || capitalizeFirst(resource.class?.code || 'Encounter'), sub: `${capitalizeFirst(resource.status || '—')} · ${(resource.period?.start || '').slice(0, 10)}`, tag: capitalizeFirst(resource.status || ''), tagClass: resource.status === 'finished' ? 'tag-gray' : resource.status === 'in-progress' ? 'tag-red' : 'tag-amber' };
    case 'Condition':
      return { title: getConditionLabel(resource), sub: `${(resource.clinicalStatus?.coding || [])[0]?.code || ''} · ${(resource.onsetDateTime || '').slice(0, 10)}`, tag: capitalizeFirst((resource.clinicalStatus?.coding || [])[0]?.code || ''), tagClass: (resource.clinicalStatus?.coding || [])[0]?.code === 'active' ? 'tag-red' : 'tag-gray' };
    case 'MedicationRequest':
      return { title: getMedicationName(resource), sub: (resource.dosageInstruction || []).map(d => d.text).filter(Boolean).join('; ') || '', tag: capitalizeFirst(resource.status || ''), tagClass: resource.status === 'active' ? 'tag-green' : 'tag-gray' };
    case 'Observation':
      return { title: resource.code?.text || (resource.code?.coding || [])[0]?.display || '—', sub: `${getObservationValue(resource)} ${resource.valueQuantity?.unit || ''}`.trim() || '', tag: null, tagClass: '' };
    case 'Invoice':
      return { title: resource.type?.text || (resource.type?.coding || [])[0]?.display || 'Invoice', sub: `₹${resource.totalGross?.value?.toFixed(2) || '0'} · ${(resource.identifier || [])[0]?.value || ''}`, tag: capitalizeFirst(resource.status || ''), tagClass: resource.status === 'issued' ? 'tag-green' : 'tag-gray' };
    case 'AllergyIntolerance':
      return { title: resource.code?.text || (resource.code?.coding || [])[0]?.display || '—', sub: (resource.reaction || []).flatMap(rx => (rx.manifestation || []).map(m => m.text || (m.coding || [])[0]?.display)).filter(Boolean).join(', '), tag: capitalizeFirst((resource.reaction || [])[0]?.severity || resource.criticality || ''), tagClass: 'tag-red' };
    case 'Immunization':
      return { title: resource.vaccineCode?.text || (resource.vaccineCode?.coding || [])[0]?.display || '—', sub: (resource.occurrenceDateTime || '').slice(0, 10), tag: capitalizeFirst(resource.status || ''), tagClass: resource.status === 'completed' ? 'tag-green' : 'tag-gray' };
    case 'Composition':
      return { title: resource.title || resource.type?.text || 'Composition', sub: `${(resource.date || '').slice(0, 10)} · ${resource.custodian?.display || ''}`, tag: capitalizeFirst(resource.status || ''), tagClass: 'tag-green' };
    default:
      return defaultDisplay();
  }
}

// ─── String / HTML utilities ───────────────────────────────────────────────

/** Capitalizes the first letter of a string. */
function capitalizeFirst(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

/** Strips HTML tags from a narrative string and truncates to 100 chars. */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

/**
 * Sanitizes a FHIR Composition narrative div for safe inline rendering.
 * Removes script tags and neutralizes external href links.
 */
function sanitizeNarrativeDiv(html) {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/href="http[^"]*"/g, 'href="#"');
}

/** HTML-escapes a string for use inside a <pre> block. */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
