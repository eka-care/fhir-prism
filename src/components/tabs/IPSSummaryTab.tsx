import { useState } from 'react';
import { useFhir } from '../../context/FhirContext';
import {
  resolveReference, cap, sanitizeNarrativeDiv,
  getConditionLabel, getMedicationName,
  getConditionStatusStyle, getMedicationStatusStyle, getAllergyStatusStyle,
  getObservationValue, getComponentValue,
} from '../../lib/helpers';
import { IPS_SECTION_LOINC } from '../../lib/constants';
import type { FhirSection, FhirResource } from '../../lib/types';

// ─── Per-resource compact row (mirrors vanilla renderIPSEntry) ──────────────

function IPSEntryRow({ resource }: { resource: FhirResource }) {
  switch (resource.resourceType) {

    case 'Condition': {
      const status = resource.clinicalStatus?.coding?.[0]?.code || 'unknown';
      const { iconClass, tagClass } = getConditionStatusStyle(status);
      const onset = resource.onsetDateTime?.slice(0, 10) || resource.onsetPeriod?.start?.slice(0, 10) || '';
      const note  = (resource.note || []).map((n: { text?: string }) => n.text).join('; ');
      return (
        <div className="card-row">
          <div className={`row-icon ${iconClass}`} style={{ fontSize: 10 }}>{status === 'active' ? 'Dx' : 'Hx'}</div>
          <div className="row-body">
            <div className="row-title">{getConditionLabel(resource)}</div>
            {note && <div className="row-detail" style={{ fontStyle: 'italic' }}>{note}</div>}
          </div>
          <div className="row-aside">
            <span className={`tag ${tagClass}`}>{cap(status)}</span>
            {onset && <div className="row-date">{onset}</div>}
          </div>
        </div>
      );
    }

    case 'AllergyIntolerance': {
      const allergen  = resource.code?.text || resource.code?.coding?.[0]?.display || '—';
      const severity  = resource.reaction?.[0]?.severity || resource.criticality || 'unknown';
      const { tagClass } = getAllergyStatusStyle(severity);
      const reactions = (resource.reaction || [])
        .flatMap((rx: { manifestation?: { text?: string; coding?: { display?: string }[] }[] }) =>
          (rx.manifestation || []).map(m => m.text || m.coding?.[0]?.display))
        .filter(Boolean).join(', ');
      return (
        <div className="card-row">
          <div className="row-icon icon-amber">⚠</div>
          <div className="row-body">
            <div className="row-title">{allergen}</div>
            {reactions && <div className="row-detail">Reactions: {reactions}</div>}
          </div>
          <div className="row-aside"><span className={`tag ${tagClass}`}>{cap(severity)}</span></div>
        </div>
      );
    }

    case 'MedicationRequest':
    case 'MedicationStatement': {
      const medName    = getMedicationName(resource);
      const status     = resource.status || 'unknown';
      const { tagClass } = getMedicationStatusStyle(status);
      const firstDose  = (resource.dosageInstruction || [])[0] || {};
      const schedule   = (firstDose.additionalInstruction || [])
        .map((ai: { text?: string; coding?: { display?: string }[] }) => ai.text || ai.coding?.[0]?.display)
        .filter(Boolean).join(', ');
      const dosageText = firstDose.text || schedule || '';
      const dispQty    = resource.dispenseRequest?.quantity;
      const dispText   = dispQty ? `${dispQty.value ?? ''} ${dispQty.unit || ''}`.trim() : '';
      return (
        <div className="card-row">
          <div className="row-icon icon-green">℞</div>
          <div className="row-body">
            <div className="row-title">
              {medName}
              {dispText && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--c-text2)', marginLeft: 6 }}>{dispText}</span>}
            </div>
            {dosageText && <div className="row-detail">{dosageText}</div>}
          </div>
          <div className="row-aside"><span className={`tag ${tagClass}`}>{cap(status)}</span></div>
        </div>
      );
    }

    case 'Immunization': {
      const vaccine = resource.vaccineCode?.text || resource.vaccineCode?.coding?.[0]?.display || '—';
      const status  = resource.status || '—';
      const date    = (resource.occurrenceDateTime || '').slice(0, 10);
      const dose    = resource.protocolApplied?.[0]?.doseNumberPositiveInt || '';
      return (
        <div className="card-row">
          <div className="row-icon icon-coral">💉</div>
          <div className="row-body">
            <div className="row-title">{vaccine}</div>
            {dose && <div className="row-detail">Dose {dose}</div>}
          </div>
          <div className="row-aside">
            <span className={`tag ${status === 'completed' ? 'tag-green' : 'tag-gray'}`}>{cap(status)}</span>
            {date && <div className="row-date">{date}</div>}
          </div>
        </div>
      );
    }

    case 'Observation': {
      const obsName    = resource.code?.text || resource.code?.coding?.[0]?.display || '—';
      const obsValue   = getObservationValue(resource as never);
      const obsUnit    = resource.valueQuantity?.unit || '';
      const date       = (resource.effectiveDateTime || '').slice(0, 10);
      const components = resource.component || [];
      return (
        <div className="card-row">
          <div className="row-icon icon-blue" style={{ fontSize: 10 }}>Obs</div>
          <div className="row-body">
            <div className="row-title">{obsName}</div>
            {components.length > 0
              ? components.map((c: { code?: { text?: string; coding?: { display?: string }[] }; valueQuantity?: { value?: number; unit?: string }; valueString?: string; valueCodeableConcept?: { text?: string; coding?: { display?: string }[] } }, ci: number) => {
                  const cName = c.code?.text || c.code?.coding?.[0]?.display || '';
                  const cVal  = getComponentValue(c as never);
                  return (
                    <div key={ci} className="row-detail">
                      {cName && <span style={{ color: 'var(--c-text2)' }}>{cName}: </span>}{cVal}
                    </div>
                  );
                })
              : <div className="row-detail">{obsValue}{obsUnit ? ` ${obsUnit}` : ''}</div>
            }
          </div>
          <div className="row-aside row-date">{date}</div>
        </div>
      );
    }

    case 'DiagnosticReport': {
      const name       = resource.code?.text || resource.code?.coding?.[0]?.display || '—';
      const status     = resource.status || '—';
      const date       = (resource.effectiveDateTime || resource.issued || '').slice(0, 10);
      const conclusion = resource.conclusion || '';
      const tagClass   = status === 'final' ? 'tag-green' : 'tag-gray';
      return (
        <div className="card-row">
          <div className="row-icon icon-amber">🔬</div>
          <div className="row-body">
            <div className="row-title">{name}</div>
            {conclusion && <div className="row-detail">{conclusion}</div>}
          </div>
          <div className="row-aside">
            <span className={`tag ${tagClass}`}>{cap(status)}</span>
            {date && <div className="row-date">{date}</div>}
          </div>
        </div>
      );
    }

    case 'Procedure': {
      const name   = resource.code?.text || resource.code?.coding?.[0]?.display || '—';
      const status = resource.status || '—';
      const date   = (resource.performedDateTime || resource.performedPeriod?.start || '').slice(0, 10);
      const note   = (resource.note || []).map((n: { text?: string }) => n.text).join('; ');
      return (
        <div className="card-row">
          <div className="row-icon icon-teal">⚕</div>
          <div className="row-body">
            <div className="row-title">{name}</div>
            {note && <div className="row-detail">{note}</div>}
          </div>
          <div className="row-aside">
            <span className="tag tag-gray">{cap(status)}</span>
            {date && <div className="row-date">{date}</div>}
          </div>
        </div>
      );
    }

    case 'Device': {
      const name = resource.deviceName?.[0]?.name || resource.type?.coding?.[0]?.display || resource.type?.text || '—';
      const status = resource.status || '—';
      const mfr    = resource.manufacturer || '';
      return (
        <div className="card-row">
          <div className="row-icon icon-blue">🩻</div>
          <div className="row-body">
            <div className="row-title">{name}</div>
            {mfr && <div className="row-detail">{mfr}</div>}
          </div>
          <div className="row-aside"><span className="tag tag-gray">{cap(status)}</span></div>
        </div>
      );
    }

    case 'DeviceUseStatement': {
      const device   = resource.device?.display || resource.device?.reference || '—';
      const bodySite = resource.bodySite?.text || resource.bodySite?.coding?.[0]?.display || '';
      const date     = (resource.recordedOn || '').slice(0, 10);
      return (
        <div className="card-row">
          <div className="row-icon icon-blue">🩻</div>
          <div className="row-body">
            <div className="row-title">{device}</div>
            {bodySite && <div className="row-detail">{bodySite}</div>}
          </div>
          <div className="row-aside row-date">{date}</div>
        </div>
      );
    }

    case 'Flag': {
      const label    = resource.code?.text || resource.code?.coding?.[0]?.display || '—';
      const status   = resource.status || '—';
      const date     = (resource.period?.start || '').slice(0, 10);
      const tagClass = status === 'active' ? 'tag-red' : 'tag-gray';
      return (
        <div className="card-row">
          <div className="row-icon icon-amber">🔔</div>
          <div className="row-body"><div className="row-title">{label}</div></div>
          <div className="row-aside">
            <span className={`tag ${tagClass}`}>{cap(status)}</span>
            {date && <div className="row-date">{date}</div>}
          </div>
        </div>
      );
    }

    case 'Consent': {
      const scope      = resource.scope?.coding?.[0]?.display || resource.scope?.text || 'Consent';
      const status     = resource.status || '—';
      const date       = (resource.dateTime || '').slice(0, 10);
      const policyText = (resource.policy || []).map((p: { uri?: string }) => p.uri).filter(Boolean).join(', ');
      return (
        <div className="card-row">
          <div className="row-icon icon-gray">📜</div>
          <div className="row-body">
            <div className="row-title">{scope}</div>
            {policyText && <div className="row-detail row-code">{policyText}</div>}
          </div>
          <div className="row-aside">
            <span className="tag tag-gray">{cap(status)}</span>
            {date && <div className="row-date">{date}</div>}
          </div>
        </div>
      );
    }

    case 'ClinicalImpression': {
      const summary  = resource.summary || resource.description || '—';
      const status   = resource.status || '—';
      const date     = (resource.effectiveDateTime || resource.date || '').slice(0, 10);
      const findings = (resource.finding || [])
        .map((f: { itemCodeableConcept?: { text?: string; coding?: { display?: string }[] } }) =>
          f.itemCodeableConcept?.text || f.itemCodeableConcept?.coding?.[0]?.display)
        .filter(Boolean).join(', ');
      return (
        <div className="card-row">
          <div className="row-icon icon-purple">🏃</div>
          <div className="row-body">
            <div className="row-title">{summary}</div>
            {findings && <div className="row-detail">{findings}</div>}
          </div>
          <div className="row-aside">
            <span className="tag tag-purple">{cap(status)}</span>
            {date && <div className="row-date">{date}</div>}
          </div>
        </div>
      );
    }

    case 'CarePlan': {
      const title  = resource.title || resource.description || 'Care Plan';
      const status = resource.status || '—';
      return (
        <div className="card-row">
          <div className="row-icon icon-purple">📋</div>
          <div className="row-body"><div className="row-title">{title}</div></div>
          <div className="row-aside"><span className="tag tag-purple">{cap(status)}</span></div>
        </div>
      );
    }

    default: {
      const display = resource.code?.text || resource.name || resource.title || resource.description || resource.resourceType;
      const status  = resource.status || '';
      const abbr    = resource.resourceType.slice(0, 3).toUpperCase();
      return (
        <div className="card-row">
          <div className="row-icon icon-gray" style={{ fontSize: 9, letterSpacing: 0 }}>{abbr}</div>
          <div className="row-body">
            <div className="row-title">{display}</div>
            <div className="row-code">{resource.resourceType}</div>
          </div>
          {status && (
            <div className="row-aside"><span className="tag tag-gray">{cap(status)}</span></div>
          )}
        </div>
      );
    }
  }
}

// ─── Section panel (recursive, collapsible) ──────────────────────────────

interface SectionPanelProps {
  section: FhirSection;
  depth?: number;
  defaultOpen?: boolean;
}

function SectionPanel({ section, depth = 0, defaultOpen = true }: SectionPanelProps) {
  const { resourceMap, rawBundle } = useFhir();
  const [open, setOpen] = useState(defaultOpen);

  const loincCode   = section.code?.coding?.find(c => c.system?.includes('loinc') || c.system?.includes('LOINC'))?.code
    || section.code?.coding?.[0]?.code || '';
  const meta        = loincCode ? IPS_SECTION_LOINC[loincCode] : null;
  const icon        = meta?.icon || '📋';
  const title       = section.title || meta?.title || section.code?.text || section.code?.coding?.[0]?.display || 'Section';
  const emptyReason = section.emptyReason?.coding?.[0]?.display || section.emptyReason?.text || '';
  const narrative   = section.text?.div ? sanitizeNarrativeDiv(section.text.div) : '';
  const subsections = section.section || [];

  const entries = (section.entry || [])
    .map(ref => resolveReference(ref.reference, resourceMap, rawBundle))
    .filter((r): r is FhirResource => r !== null);

  const totalItems = entries.length || subsections.length;
  const isEmpty    = !entries.length && !subsections.length && !narrative;

  const radiusHeadClass = depth > 0 ? 'prism-rounded-t-7' : '';
  const radiusBodyClass = depth > 0 ? 'prism-rounded-b-7' : '';

  return (
    <div className={depth > 0 ? 'ips-subsection ips-section' : 'ips-section'}>

      {/* ── Clickable header ── */}
      <div
        className={`ips-section-head ${open ? radiusHeadClass : 'prism-rounded-12'}`}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <span className="ips-section-head-icon">{icon}</span>
        <span className="ips-section-head-title">{title}</span>
        {loincCode && <span className="ips-section-head-loinc">{loincCode}</span>}

        {/* Right side: entry count + chevron */}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {totalItems > 0 && (
            <span className="tag tag-gray" style={{ fontSize: 10 }}>{totalItems}</span>
          )}
          {isEmpty && emptyReason && (
            <span className="tag tag-gray" style={{ fontSize: 10 }}>empty</span>
          )}
          <span style={{
            fontSize: 11, color: 'var(--c-text3)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </span>
      </div>

      {/* ── Collapsible body ── */}
      {open && (
        <div className={`ips-section-body ${radiusBodyClass}`}>
          {/* Empty reason */}
          {emptyReason && entries.length === 0 && subsections.length === 0 && (
            <div className="ips-empty">Not available: {emptyReason}</div>
          )}

          {/* Resolved entries */}
          {entries.length > 0 && entries.map((res, i) => (
            <IPSEntryRow key={i} resource={res} />
          ))}

          {/* Narrative fallback */}
          {entries.length === 0 && subsections.length === 0 && narrative && !emptyReason && (
            <div className="ips-narrative" dangerouslySetInnerHTML={{ __html: narrative }} />
          )}

          {/* Truly empty */}
          {entries.length === 0 && subsections.length === 0 && !narrative && !emptyReason && (
            <div className="ips-empty">No entries</div>
          )}
        </div>
      )}

      {/* ── Recursive sub-sections (only when open) ── */}
      {open && subsections.map((sub, i) => (
        <SectionPanel key={i} section={sub} depth={depth + 1} defaultOpen={false} />
      ))}
    </div>
  );
}

// ─── Tab root ───────────────────────────────────────────────────────────────

export function IPSSummaryTab() {
  const { resourceMap } = useFhir();
  const compositions = resourceMap['Composition'] || [];

  // Prefer IPS-profiled composition; fall back to first
  const ipsComp = compositions.find(c =>
    (c.meta?.profile || []).some((p: string) => p.toLowerCase().includes('ips') || p.includes('PatientSummary'))
  ) || compositions[0];

  if (!ipsComp) return <div className="empty-state">No Composition found.</div>;

  const sections: FhirSection[] = ipsComp.section || [];
  if (!sections.length) return <div className="empty-state">No sections in this Composition.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {sections.map((section, i) => (
        <SectionPanel key={i} section={section} />
      ))}
    </div>
  );
}
