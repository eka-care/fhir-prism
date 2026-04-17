import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function FunctionalStatusTab() {
  const { resourceMap } = useFhir();
  const impressions = resourceMap['ClinicalImpression'] || [];
  if (!impressions.length) return <div className="empty-state">No functional status / clinical impressions.</div>;

  return (
    <div className="card">
      {impressions.map((ci, i) => {
        const title    = ci.summary || ci.description || 'Clinical Impression';
        const status   = ci.status || '—';
        const date     = (ci.effectiveDateTime || ci.date || '').slice(0, 10);
        const findings = (ci.finding || [])
          .map((f: { itemCodeableConcept?: { text?: string; coding?: { display?: string }[] } }) =>
            f.itemCodeableConcept?.text || f.itemCodeableConcept?.coding?.[0]?.display)
          .filter(Boolean);
        const tagClass = status === 'completed' ? 'tag-green' : status === 'in-progress' ? 'tag-amber' : 'tag-gray';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-blue">🏃</div>
            <div className="row-body">
              <div className="row-title">{title}</div>
              {findings.length > 0 && (
                <div className="row-detail">{findings.join(', ')}</div>
              )}
            </div>
            <div className="row-aside">
              <span className={`tag ${tagClass}`}>{cap(status)}</span>
              {date && <div className="row-date">{date}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
