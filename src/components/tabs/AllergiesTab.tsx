import { useFhir } from '../../context/FhirContext';
import { getAllergyStatusStyle, cap } from '../../lib/helpers';

export function AllergiesTab() {
  const { resourceMap } = useFhir();
  const allergies = resourceMap['AllergyIntolerance'] || [];
  if (!allergies.length) return <div className="empty-state">No allergy records.</div>;

  return (
    <div className="card">
      {allergies.map((a, i) => {
        const name       = a.code?.text || a.code?.coding?.[0]?.display || '—';
        const severity   = a.reaction?.[0]?.severity || a.criticality || 'unknown';
        const reactions  = (a.reaction || []).flatMap((rx: { manifestation?: { text?: string; coding?: { display?: string }[] }[] }) =>
          (rx.manifestation || []).map((m: { text?: string; coding?: { display?: string }[] }) => m.text || m.coding?.[0]?.display)
        ).filter(Boolean).join(', ');
        const type       = a.type || '';
        const category   = (a.category || []).join(', ');
        const note       = (a.note || []).map((n: { text?: string }) => n.text).join('; ');
        const date       = (a.recordedDate || '').slice(0, 10);
        const { iconClass, tagClass } = getAllergyStatusStyle(severity);

        return (
          <div key={i} className="card-row">
            <div className={`row-icon ${iconClass}`}>⚠</div>
            <div className="row-body">
              <div className="row-title">{name}</div>
              <div className="row-detail">
                {[type, category].filter(Boolean).join(' · ')}
                {reactions && <><br />Reactions: {reactions}</>}
                {note      && <><br />{note}</>}
              </div>
            </div>
            <div className="row-aside">
              <span className={`tag ${tagClass}`}>{cap(severity)}</span>
              <div className="row-date">{date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
