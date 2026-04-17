export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirQuantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirReference {
  reference?: string;
  display?: string;
}

export interface FhirName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
}

export interface FhirIdentifier {
  system?: string;
  value?: string;
  type?: FhirCodeableConcept;
}

export interface FhirAnnotation {
  text?: string;
  authorString?: string;
}

export interface FhirTelecom {
  system?: string;
  value?: string;
  use?: string;
}

export interface FhirAddress {
  city?: string;
  state?: string;
  country?: string;
  text?: string;
}

export interface FhirMeta {
  profile?: string[];
  security?: FhirCoding[];
}

export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: FhirIdentifier[];
  name?: FhirName[];
  birthDate?: string;
  gender?: string;
  telecom?: FhirTelecom[];
  address?: FhirAddress[];
  text?: { div?: string };
  meta?: FhirMeta;
}

export interface FhirPractitioner {
  resourceType: 'Practitioner';
  id?: string;
  name?: FhirName[];
  qualification?: Array<{ code?: FhirCodeableConcept }>;
  telecom?: FhirTelecom[];
}

export interface FhirOrganization {
  resourceType: 'Organization';
  id?: string;
  name?: string;
  telecom?: FhirTelecom[];
  address?: FhirAddress[];
}

export interface FhirCondition {
  resourceType: 'Condition';
  id?: string;
  code?: FhirCodeableConcept;
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  onsetDateTime?: string;
  onsetPeriod?: FhirPeriod;
  note?: FhirAnnotation[];
}

export interface FhirDosageInstruction {
  text?: string;
  route?: FhirCodeableConcept;
  timing?: {
    code?: FhirCodeableConcept;
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: string;
      when?: string[];
      boundsDuration?: FhirQuantity;
    };
  };
  doseAndRate?: Array<{ doseQuantity?: FhirQuantity }>;
  additionalInstruction?: FhirCodeableConcept[];
}

export interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  id?: string;
  status?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: FhirReference;
  medication?: { concept?: FhirCodeableConcept };
  dosageInstruction?: FhirDosageInstruction[];
  authoredOn?: string;
  note?: FhirAnnotation[];
  dispenseRequest?: { quantity?: FhirQuantity; validityPeriod?: FhirPeriod };
}

export interface FhirMedicationStatement {
  resourceType: 'MedicationStatement';
  id?: string;
  status?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: FhirReference;
  medication?: { concept?: FhirCodeableConcept };
  dosageInstruction?: FhirDosageInstruction[];
  note?: FhirAnnotation[];
  dispenseRequest?: { quantity?: FhirQuantity; validityPeriod?: FhirPeriod };
}

export interface FhirObservationComponent {
  code?: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueCodeableConcept?: FhirCodeableConcept;
  valueBoolean?: boolean;
  valueInteger?: number;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id?: string;
  code?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  status?: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueCodeableConcept?: FhirCodeableConcept;
  valueBoolean?: boolean;
  valueInteger?: number;
  effectiveDateTime?: string;
  issued?: string;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: Array<{ low?: FhirQuantity; high?: FhirQuantity; text?: string }>;
  component?: FhirObservationComponent[];
  note?: FhirAnnotation[];
}

export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id?: string;
  code?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  status?: string;
  effectiveDateTime?: string;
  issued?: string;
  performer?: FhirReference[];
  result?: FhirReference[];
  conclusion?: string;
  presentedForm?: Array<{ contentType?: string; data?: string; url?: string; title?: string }>;
}

export interface FhirAllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  id?: string;
  code?: FhirCodeableConcept;
  type?: string;
  category?: string[];
  criticality?: string;
  recordedDate?: string;
  reaction?: Array<{ manifestation?: FhirCodeableConcept[]; severity?: string }>;
  note?: FhirAnnotation[];
}

export interface FhirImmunization {
  resourceType: 'Immunization';
  id?: string;
  vaccineCode?: FhirCodeableConcept;
  status?: string;
  occurrenceDateTime?: string;
  occurrenceString?: string;
  lotNumber?: string;
  site?: FhirCodeableConcept;
  route?: FhirCodeableConcept;
  performer?: Array<{ actor?: FhirReference }>;
  protocolApplied?: Array<{ series?: string; doseNumberPositiveInt?: number; doseNumberString?: string }>;
  note?: FhirAnnotation[];
}

export interface FhirProcedure {
  resourceType: 'Procedure';
  id?: string;
  code?: FhirCodeableConcept;
  status?: string;
  performedDateTime?: string;
  performedPeriod?: FhirPeriod;
  performer?: Array<{ actor?: FhirReference }>;
  bodySite?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
}

export interface FhirFamilyMemberHistory {
  resourceType: 'FamilyMemberHistory';
  id?: string;
  relationship?: FhirCodeableConcept;
  status?: string;
  deceasedBoolean?: boolean;
  condition?: Array<{ code?: FhirCodeableConcept }>;
}

export interface FhirServiceRequest {
  resourceType: 'ServiceRequest';
  id?: string;
  code?: FhirCodeableConcept;
  status?: string;
  intent?: string;
  priority?: string;
  authoredOn?: string;
  requester?: FhirReference;
  note?: FhirAnnotation[];
}

export interface FhirInvoice {
  resourceType: 'Invoice';
  id?: string;
  identifier?: FhirIdentifier[];
  type?: FhirCodeableConcept;
  status?: string;
  date?: string;
  totalGross?: { value?: number; currency?: string };
  totalNet?: { value?: number; currency?: string };
  lineItem?: Array<{
    sequence?: number;
    chargeItemReference?: FhirReference;
    chargeItemCodeableConcept?: FhirCodeableConcept;
    priceComponent?: Array<{ type?: string; amount?: { value?: number; currency?: string } }>;
  }>;
}

export interface FhirChargeItem {
  resourceType: 'ChargeItem';
  id?: string;
  code?: FhirCodeableConcept;
  status?: string;
  quantity?: FhirQuantity;
  productReference?: FhirReference;
}

export interface FhirEncounter {
  resourceType: 'Encounter';
  id?: string;
  identifier?: FhirIdentifier[];
  type?: FhirCodeableConcept[];
  class?: { code?: string; display?: string };
  status?: string;
  period?: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
}

export interface FhirDocumentReference {
  resourceType: 'DocumentReference';
  id?: string;
  type?: FhirCodeableConcept;
  status?: string;
  date?: string;
  indexed?: string;
  description?: string;
  content?: Array<{ attachment?: { contentType?: string; data?: string; url?: string; title?: string } }>;
}

export interface FhirCarePlan {
  resourceType: 'CarePlan';
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  activity?: Array<{ detail?: { code?: FhirCodeableConcept }; reference?: FhirReference }>;
}

export interface FhirGoal {
  resourceType: 'Goal';
  id?: string;
  description?: FhirCodeableConcept;
  lifecycleStatus?: string;
}

export interface FhirCoverage {
  resourceType: 'Coverage';
  id?: string;
  identifier?: FhirIdentifier[];
  type?: FhirCodeableConcept;
  status?: string;
  subscriberId?: string;
  payor?: FhirReference[];
  period?: FhirPeriod;
}

export interface FhirDevice {
  resourceType: 'Device';
  id?: string;
  type?: FhirCodeableConcept;
  status?: string;
  manufacturer?: string;
  deviceName?: Array<{ name?: string }>;
}

export interface FhirDeviceUseStatement {
  resourceType: 'DeviceUseStatement';
  id?: string;
  device?: FhirReference;
  bodySite?: FhirCodeableConcept;
  recordedOn?: string;
}

export interface FhirFlag {
  resourceType: 'Flag';
  id?: string;
  code?: FhirCodeableConcept;
  status?: string;
  period?: FhirPeriod;
}

export interface FhirConsent {
  resourceType: 'Consent';
  id?: string;
  scope?: FhirCodeableConcept;
  status?: string;
  dateTime?: string;
  policy?: Array<{ uri?: string }>;
}

export interface FhirClinicalImpression {
  resourceType: 'ClinicalImpression';
  id?: string;
  summary?: string;
  description?: string;
  status?: string;
  effectiveDateTime?: string;
  date?: string;
  finding?: Array<{ itemCodeableConcept?: FhirCodeableConcept }>;
}

export interface FhirSection {
  title?: string;
  code?: FhirCodeableConcept;
  entry?: FhirReference[];
  text?: { div?: string };
  emptyReason?: FhirCodeableConcept;
  section?: FhirSection[];
}

export interface FhirComposition {
  resourceType: 'Composition';
  id?: string;
  title?: string;
  type?: FhirCodeableConcept;
  status?: string;
  date?: string;
  custodian?: FhirReference;
  author?: FhirReference[];
  meta?: FhirMeta;
  section?: FhirSection[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FhirResource = Record<string, any> & { resourceType: string };

export type ResourceMap = Record<string, FhirResource[]>;

export interface FhirBundle {
  resourceType: string;
  type?: string;
  timestamp?: string;
  entry?: Array<{ fullUrl?: string; resource?: FhirResource }>;
  meta?: FhirMeta;
}

export interface DocType {
  name: string;
  icon: string;
  color: string;
  tag: string;
  desc: string;
}

export interface MediaItem {
  data?: string;       // base64-encoded content (inline)
  url?: string;        // remote URL (when no inline data)
  contentType: string;
  title: string;
}
