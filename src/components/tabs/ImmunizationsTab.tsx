import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function ImmunizationsTab() {
  const { resourceMap } = useFhir();
  const list = resourceMap['Immunization'] || [];
  if (!list.length) return <div className="empty-state">No immunization records.</div>;

  return (
    <div className="card">
      {list.map((imm, i) => {
        const vaccine  = imm.vaccineCode?.text || imm.vaccineCode?.coding?.[0]?.display || '—';
        const status   = imm.status || '—';
        const date     = (imm.occurrenceDateTime || imm.occurrenceString || '').slice(0, 10);
        const lot      = imm.lotNumber || '';
        const site     = imm.site?.text || '';
        const route    = imm.route?.text || '';
        const performer = (imm.performer || []).map((p: { actor?: { display?: string } }) => p.actor?.display).filter(Boolean).join(', ');
        const dose     = imm.protocolApplied?.[0]?.doseNumberPositiveInt || imm.protocolApplied?.[0]?.doseNumberString || '';
        const series   = imm.protocolApplied?.[0]?.series || '';
        const note     = (imm.note || []).map((n: { text?: string }) => n.text).join('; ');
        const details  = [dose ? `Dose ${dose}` : '', series, lot ? `Lot: ${lot}` : '', site, route, performer].filter(Boolean).join(' · ');

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-coral">💉</div>
            <div className="row-body">
              <div className="row-title">{vaccine}</div>
              {details && <div className="row-detail">{details}</div>}
              {note    && <div className="row-detail" style={{ fontStyle: 'italic' }}>{note}</div>}
            </div>
            <div className="row-aside">
              <span className={`tag ${status === 'completed' ? 'tag-green' : 'tag-gray'}`}>{cap(status)}</span>
              <div className="row-date">{date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
