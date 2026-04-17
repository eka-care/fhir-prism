import type { FhirResource, FhirBundle, ResourceMap, FhirObservation, FhirObservationComponent, FhirCoding } from './types';
import { KEY_VITAL_CODE_MAP, VITAL_LOINC_CODES, LAB_OBSERVATION_CATEGORIES } from './constants';

// ─── Patient helpers ───────────────────────────────────────────────────────

export function getPatientName(patient: FhirResource): string {
  if (!patient.name?.length) {
    return patient.text?.div ? stripHtml(patient.text.div) : 'Unknown';
  }
  const n = patient.name[0];
  return n.text || [n.prefix?.[0], ...(n.given || []), n.family].filter(Boolean).join(' ') || 'Unknown';
}

export function getPatientInitials(patient: FhirResource): string {
  return getPatientName(patient)
    .replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, '')
    .split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
}

export function getPatientMRN(patient: FhirResource): string {
  if (!patient.identifier) return patient.id || '—';
  const mrn = patient.identifier.find(
    (id: FhirResource) => (id.type?.coding || []).some((c: FhirResource) => c.code === 'MR') || (id.system || '').toLowerCase().includes('mrn')
  );
  return mrn?.value || patient.identifier[0]?.value || patient.id || '—';
}

export function calculateAge(dob: string): number | string {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday = today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age;
}

// ─── Practitioner helpers ──────────────────────────────────────────────────

export function getPractitionerName(p: FhirResource): string {
  if (!p.name?.length) return 'Practitioner';
  const n = p.name[0];
  return n.text || [n.prefix?.[0], ...(n.given || []), n.family].filter(Boolean).join(' ') || 'Practitioner';
}

// ─── Medication helpers ────────────────────────────────────────────────────

export function getMedicationName(med: FhirResource): string {
  return med.medicationCodeableConcept?.text ||
    med.medicationCodeableConcept?.coding?.[0]?.display ||
    med.medicationReference?.display ||
    med.medication?.concept?.text ||
    'Unknown medication';
}

// ─── Condition helpers ─────────────────────────────────────────────────────

export function getConditionLabel(cond: FhirResource): string {
  return cond.code?.text || cond.code?.coding?.[0]?.display || 'Unknown condition';
}

// ─── Observation helpers ───────────────────────────────────────────────────

export function getObservationValue(obs: FhirObservation): string {
  if (obs.valueQuantity != null)    return obs.valueQuantity.value?.toString() ?? '—';
  if (obs.valueString)              return obs.valueString;
  if (obs.valueCodeableConcept)     return obs.valueCodeableConcept.text || obs.valueCodeableConcept.coding?.[0]?.display || '—';
  if (obs.valueBoolean != null)     return obs.valueBoolean ? 'Yes' : 'No';
  if (obs.valueInteger != null)     return obs.valueInteger.toString();
  if (obs.component)                return obs.component.map(c => c.valueQuantity?.value).filter(Boolean).join('/');
  return '—';
}

export function getComponentValue(comp: FhirObservationComponent): string {
  if (comp.valueQuantity != null)   return `${comp.valueQuantity.value ?? '—'} ${comp.valueQuantity.unit || ''}`.trim();
  if (comp.valueString)             return comp.valueString;
  if (comp.valueCodeableConcept)    return comp.valueCodeableConcept.text || comp.valueCodeableConcept.coding?.[0]?.display || '—';
  if (comp.valueBoolean != null)    return comp.valueBoolean ? 'Yes' : 'No';
  if (comp.valueInteger != null)    return comp.valueInteger.toString();
  return '—';
}

export function getObservationReferenceRange(obs: FhirObservation): string {
  if (!obs.referenceRange?.length) return '—';
  const r = obs.referenceRange[0];
  if (r.text) return r.text;
  if (r.low?.value != null && r.high?.value != null) return `${r.low.value}–${r.high.value}`;
  if (r.high?.value != null) return `< ${r.high.value}`;
  if (r.low?.value != null)  return `> ${r.low.value}`;
  return '—';
}

export function isVitalObservation(obs: FhirObservation): boolean {
  const cats = (obs.category || [])
    .flatMap(cat => (cat.coding || []).map((c: FhirCoding) => c.code || ''))
    .concat((obs.category || []).map(cat => cat.text || ''));
  if (cats.some(c => c.toLowerCase().includes('vital'))) return true;
  const loincs = (obs.code?.coding || []).map((c: FhirCoding) => c.code);
  return loincs.some((code: string | undefined) => code && VITAL_LOINC_CODES.has(code));
}

export function isLabObservation(obs: FhirObservation): boolean {
  const cats = (obs.category || [])
    .flatMap(cat => (cat.coding || []).map((c: FhirCoding) => c.code || ''))
    .concat((obs.category || []).map(cat => cat.text || ''));
  return cats.some(c => LAB_OBSERVATION_CATEGORIES.has(c) || c.toLowerCase().includes('lab'));
}

export function getKeyVitals(resourceMap: ResourceMap): Array<{ label: string; value: string; unit: string; isHigh: boolean; isLow: boolean }> {
  const observations = (resourceMap['Observation'] || []) as FhirObservation[];
  const seenCodes = new Set<string>();
  const results: Array<{ label: string; value: string; unit: string; isHigh: boolean; isLow: boolean }> = [];

  observations.forEach(obs => {
    const matched = (obs.code?.coding || []).find((c: FhirCoding) => c.code && KEY_VITAL_CODE_MAP[c.code]);
    if (!matched?.code || seenCodes.has(matched.code)) return;
    seenCodes.add(matched.code);
    const cfg = KEY_VITAL_CODE_MAP[matched.code];
    const value = obs.component
      ? obs.component.map(c => c.valueQuantity?.value?.toFixed(0)).filter(Boolean).join('/')
      : obs.valueQuantity?.value != null ? String(obs.valueQuantity.value) : getObservationValue(obs);
    const num = parseFloat(value);
    results.push({ label: cfg.label, value, unit: cfg.unit, isHigh: !!(cfg.high && num > cfg.high), isLow: !!(cfg.low && num < cfg.low) });
  });
  return results;
}

// ─── Reference resolution ──────────────────────────────────────────────────

export function resolveReference(ref: string | undefined, resourceMap: ResourceMap, rawBundle: FhirBundle | null): FhirResource | null {
  if (!ref) return null;
  const slashIdx = ref.indexOf('/');
  if (slashIdx !== -1 && !ref.startsWith('urn:')) {
    const type = ref.substring(0, slashIdx);
    const id   = ref.substring(slashIdx + 1);
    const found = (resourceMap[type] || []).find(r => r.id === id);
    if (found) return found;
  }
  const uuidPart = ref.startsWith('urn:uuid:') ? ref.slice(9) : null;
  if (uuidPart) {
    for (const resources of Object.values(resourceMap)) {
      const found = resources.find(r => r.id === uuidPart);
      if (found) return found;
    }
  }
  for (const entry of (rawBundle?.entry || [])) {
    if (entry.fullUrl === ref && entry.resource) return entry.resource as FhirResource;
  }
  return null;
}

// ─── Status style helpers ──────────────────────────────────────────────────

export function getConditionStatusStyle(status: string): { iconClass: string; tagClass: string } {
  if (status === 'active')                                    return { iconClass: 'icon-red',   tagClass: 'tag-red'   };
  if (['resolved', 'inactive', 'remission'].includes(status)) return { iconClass: 'icon-gray',  tagClass: 'tag-gray'  };
  return { iconClass: 'icon-amber', tagClass: 'tag-amber' };
}

export function getMedicationStatusStyle(status: string): { iconClass: string; tagClass: string } {
  if (['active', 'on-hold'].includes(status))                 return { iconClass: 'icon-green', tagClass: 'tag-green' };
  if (['stopped', 'cancelled', 'completed'].includes(status)) return { iconClass: 'icon-gray',  tagClass: 'tag-gray'  };
  return { iconClass: 'icon-blue', tagClass: 'tag-blue' };
}

export function getAllergyStatusStyle(severity: string): { iconClass: string; tagClass: string } {
  if (['severe', 'high'].includes(severity)) return { iconClass: 'icon-red',   tagClass: 'tag-red'   };
  if (['moderate'].includes(severity))       return { iconClass: 'icon-amber', tagClass: 'tag-amber' };
  return { iconClass: 'icon-gray', tagClass: 'tag-gray' };
}

// ─── All Resources display ─────────────────────────────────────────────────

export function getResourceDisplayInfo(resource: FhirResource, resourceMap: ResourceMap): { title: string; sub: string; tag: string | null; tagClass: string } {
  const type = resource.resourceType;
  const def = () => {
    const skip = new Set(['resourceType', 'id', 'text', 'meta', 'extension', '_id']);
    const sub = Object.entries(resource).filter(([k]) => !skip.has(k)).slice(0, 3)
      .map(([k, v]) => `${k}: ${JSON.stringify(v).slice(0, 50)}`).join(' · ');
    return { title: resource.id || type, sub, tag: null, tagClass: '' };
  };
  switch (type) {
    case 'Patient':     return { title: getPatientName(resource), sub: `${resource.gender || ''} · DOB: ${resource.birthDate || '—'} · MRN: ${getPatientMRN(resource)}`, tag: cap(resource.gender || ''), tagClass: 'tag-blue' };
    case 'Practitioner': return { title: getPractitionerName(resource), sub: (resource.qualification || []).map((q: FhirResource) => q.code?.text).filter(Boolean).join(', ') || resource.id || '', tag: null, tagClass: '' };
    case 'Organization': return { title: resource.name || 'Organization', sub: (resource.address || []).map((a: FhirResource) => [a.city, a.state].filter(Boolean).join(', ')).join(' · ') || resource.id || '', tag: null, tagClass: '' };
    case 'Encounter':   return { title: (resource.type || []).map((t: FhirResource) => t.text || t.coding?.[0]?.display).filter(Boolean).join(', ') || cap(resource.class?.code || 'Encounter'), sub: `${cap(resource.status || '—')} · ${(resource.period?.start || '').slice(0, 10)}`, tag: cap(resource.status || ''), tagClass: resource.status === 'finished' ? 'tag-gray' : resource.status === 'in-progress' ? 'tag-red' : 'tag-amber' };
    case 'Condition':   return { title: getConditionLabel(resource), sub: `${resource.clinicalStatus?.coding?.[0]?.code || ''} · ${(resource.onsetDateTime || '').slice(0, 10)}`, tag: cap(resource.clinicalStatus?.coding?.[0]?.code || ''), tagClass: resource.clinicalStatus?.coding?.[0]?.code === 'active' ? 'tag-red' : 'tag-gray' };
    case 'MedicationRequest': return { title: getMedicationName(resource), sub: (resource.dosageInstruction || []).map((d: FhirResource) => d.text).filter(Boolean).join('; ') || '', tag: cap(resource.status || ''), tagClass: resource.status === 'active' ? 'tag-green' : 'tag-gray' };
    case 'Observation': return { title: resource.code?.text || resource.code?.coding?.[0]?.display || '—', sub: `${getObservationValue(resource as FhirObservation)} ${resource.valueQuantity?.unit || ''}`.trim() || '', tag: null, tagClass: '' };
    case 'Invoice':     return { title: resource.type?.text || resource.type?.coding?.[0]?.display || 'Invoice', sub: `₹${resource.totalGross?.value?.toFixed(2) || '0'} · ${resource.identifier?.[0]?.value || ''}`, tag: cap(resource.status || ''), tagClass: resource.status === 'issued' ? 'tag-green' : 'tag-gray' };
    case 'AllergyIntolerance': return { title: resource.code?.text || resource.code?.coding?.[0]?.display || '—', sub: (resource.reaction || []).flatMap((rx: FhirResource) => (rx.manifestation || []).map((m: FhirResource) => m.text || m.coding?.[0]?.display)).filter(Boolean).join(', '), tag: cap(resource.reaction?.[0]?.severity || resource.criticality || ''), tagClass: 'tag-red' };
    case 'Immunization': return { title: resource.vaccineCode?.text || resource.vaccineCode?.coding?.[0]?.display || '—', sub: (resource.occurrenceDateTime || '').slice(0, 10), tag: cap(resource.status || ''), tagClass: resource.status === 'completed' ? 'tag-green' : 'tag-gray' };
    case 'Composition': return { title: resource.title || resource.type?.text || 'Composition', sub: `${(resource.date || '').slice(0, 10)} · ${resource.custodian?.display || ''}`, tag: cap(resource.status || ''), tagClass: 'tag-green' };
    default: return def();
  }
  // suppress unused warning
  void resourceMap;
}

// ─── Medication timing ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTimingText(timing: any): string {
  if (!timing) return '';
  if (timing.code?.text) return timing.code.text;
  const r = timing.repeat;
  if (!r) return '';
  const parts: string[] = [];
  if (r.frequency && r.period && r.periodUnit) {
    const freq = r.frequency === 1 ? 'Once' : r.frequency === 2 ? 'Twice' : `${r.frequency}×`;
    const unitMap: Record<string, string> = { s: 'second', min: 'minute', h: 'hour', d: 'day', wk: 'week', mo: 'month', a: 'year' };
    const unit = unitMap[r.periodUnit] || r.periodUnit;
    parts.push(r.period === 1 ? `${freq} per ${unit}` : `${freq} every ${r.period} ${unit}s`);
  } else if (r.frequency) {
    parts.push(`${r.frequency}×`);
  }
  if (r.when?.length) {
    const whenMap: Record<string, string> = { MORN: 'Morning', AFT: 'Afternoon', EVE: 'Evening', NIGHT: 'Night', AC: 'Before meals', PC: 'After meals', HS: 'At bedtime', C: 'With meals' };
    parts.push(r.when.map((w: string) => whenMap[w] || w).join(', '));
  }
  return parts.join(' · ');
}

// ─── String utilities ──────────────────────────────────────────────────────

export function cap(str: string): string {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export function sanitizeNarrativeDiv(html: string): string {
  return html.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/href="http[^"]*"/g, 'href="#"');
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
