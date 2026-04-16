import { useFhir } from '../context/FhirContext';
import { getPractitionerName, cap } from '../lib/helpers';
import type { FhirResource } from '../lib/types';

export function InfoGrid() {
  const { resourceMap } = useFhir();
  const cards: React.ReactNode[] = [];

  // Consulting doctor
  const practitioner = (resourceMap['Practitioner'] || [])[0];
  if (practitioner) {
    const quals = (practitioner.qualification || [])
      .map((q: { code?: { text?: string; coding?: { display?: string }[] } }) => q.code?.text || q.code?.coding?.[0]?.display)
      .filter(Boolean).join(', ');
    cards.push(
      <div key="doctor" className="info-card">
        <div className="info-label">Consulting Doctor</div>
        <div className="info-value">{getPractitionerName(practitioner)}</div>
        {quals && <div className="info-sub">{quals}</div>}
      </div>
    );
  }

  // Facility
  const org = (resourceMap['Organization'] || [])[0];
  if (org) {
    const phone = (org.telecom || []).find((t: { system?: string }) => t.system === 'phone')?.value || '';
    cards.push(
      <div key="facility" className="info-card">
        <div className="info-label">Facility</div>
        <div className="info-value">{org.name || '—'}</div>
        {phone && phone !== '-' && <div className="info-sub">☎ {phone}</div>}
      </div>
    );
  }

  // Encounter
  const encounter = (resourceMap['Encounter'] || [])[0];
  if (encounter) {
    const cls    = encounter.class?.display || cap(encounter.class?.code || '');
    const status = encounter.status || '—';
    const start  = (encounter.period?.start || '').slice(0, 10);
    const encId  = (encounter.identifier || [])[0]?.value || '';
    cards.push(
      <div key="encounter" className="info-card">
        <div className="info-label">Encounter</div>
        <div className="info-value">{cls}</div>
        <div className="info-sub">
          {cap(status)}{start && ` · ${start}`}{encId && ` · #${encId}`}
        </div>
      </div>
    );
  }

  // Document date
  const composition = (resourceMap['Composition'] || [])[0];
  if (composition) {
    const docDate = (composition.date || '').slice(0, 10);
    const author  = composition.author?.[0]?.display ||
      (resourceMap['Practitioner'] || []).map((p: FhirResource) => getPractitionerName(p)).filter(Boolean)[0] || '';
    if (docDate) {
      cards.push(
        <div key="docdate" className="info-card">
          <div className="info-label">Document Date</div>
          <div className="info-value">{docDate}</div>
          {author && <div className="info-sub">By {author}</div>}
        </div>
      );
    }
  }

  if (!cards.length) return null;

  return (
    <div
      className="prism-grid prism-gap-10 prism-mb-14"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
    >
      {cards}
    </div>
  );
}
