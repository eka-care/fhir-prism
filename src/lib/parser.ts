import type { FhirBundle, FhirResource, ResourceMap, DocType } from './types';
import { ABDM_DOC_TYPES, DEFAULT_DOC_TYPE } from './constants';
import { isLabObservation } from './helpers';

export interface ParseResult {
  resourceMap: ResourceMap;
  rawBundle: FhirBundle;
  docType: DocType;
  error?: string;
}

function detectDocumentType(resourceMap: ResourceMap): DocType {
  const compositions = resourceMap['Composition'] || [];
  if (!compositions.length) return { ...DEFAULT_DOC_TYPE };

  const comp = compositions[0];
  const profiles = comp.meta?.profile || [];

  // IPS detection
  const isIPS = profiles.some((url: string) =>
    url.toLowerCase().includes('ips') || url.includes('PatientSummary') || url.includes('patient-summary')
  ) || (comp.type?.coding || []).some((c: FhirResource) => c.code === '60591-5');
  if (isIPS) return ABDM_DOC_TYPES.PatientSummary;

  // Profile URL match
  for (const profileUrl of profiles) {
    for (const [key, cfg] of Object.entries(ABDM_DOC_TYPES)) {
      if (profileUrl.includes(key)) return cfg;
    }
  }

  // Title keywords
  const title = (comp.title || '').toLowerCase();
  if (title.includes('invoice'))                                          return ABDM_DOC_TYPES.InvoiceRecord;
  if (title.includes('discharge'))                                        return ABDM_DOC_TYPES.DischargeSummaryRecord;
  if (title.includes('prescription') || title.includes('medication'))    return ABDM_DOC_TYPES.PrescriptionRecord;
  if (title.includes('lab') || title.includes('diagnostic') || title.includes('report')) return ABDM_DOC_TYPES.DiagnosticReportRecord;
  if (title.includes('immunization') || title.includes('vaccination'))   return ABDM_DOC_TYPES.ImmunizationRecord;
  if (title.includes('wellness'))                                         return ABDM_DOC_TYPES.WellnessRecord;
  if (title.includes('opd') || title.includes('consultation') || title.includes('consult')) return ABDM_DOC_TYPES.OPConsultRecord;

  // Resource type inference
  if (resourceMap['Invoice'])                                                      return ABDM_DOC_TYPES.InvoiceRecord;
  if (resourceMap['Immunization'])                                                 return ABDM_DOC_TYPES.ImmunizationRecord;
  if ((resourceMap['Observation'] || []).some(obs => isLabObservation(obs as never))) return ABDM_DOC_TYPES.DiagnosticReportRecord;
  if (resourceMap['MedicationRequest'])                                            return ABDM_DOC_TYPES.PrescriptionRecord;

  return { ...DEFAULT_DOC_TYPE };
}

export function parseBundle(jsonText: string): ParseResult {
  let bundle: FhirBundle;
  try {
    bundle = JSON.parse(jsonText);
  } catch (e) {
    return { resourceMap: {}, rawBundle: {} as FhirBundle, docType: { ...DEFAULT_DOC_TYPE }, error: `Invalid JSON: ${(e as Error).message}` };
  }

  if (!bundle.resourceType) {
    return { resourceMap: {}, rawBundle: bundle, docType: { ...DEFAULT_DOC_TYPE }, error: 'Not a FHIR resource' };
  }

  if (bundle.resourceType !== 'Bundle') {
    bundle = { resourceType: 'Bundle', type: 'collection', entry: [{ resource: bundle as unknown as FhirResource }] };
  }

  const resourceMap: ResourceMap = {};
  const seenIds = new Set<string>();

  (bundle.entry || []).forEach(entry => {
    const resource = entry.resource;
    if (!resource?.resourceType) return;
    if (!resourceMap[resource.resourceType]) resourceMap[resource.resourceType] = [];
    const uid = `${resource.resourceType}/${resource.id || Math.random()}`;
    if (seenIds.has(uid)) return;
    seenIds.add(uid);
    resourceMap[resource.resourceType].push(resource);
  });

  const docType = detectDocumentType(resourceMap);
  return { resourceMap, rawBundle: bundle, docType };
}
