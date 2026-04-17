import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function FamilyHistoryTab() {
  const { resourceMap } = useFhir();
  const list = resourceMap['FamilyMemberHistory'] || [];
  if (!list.length) return <div className="empty-state">No family history.</div>;

  return (
    <div className="card">
      {list.map((fmh, i) => {
        const rel        = fmh.relationship?.text || fmh.relationship?.coding?.[0]?.display || '—';
        const status     = fmh.status || '—';
        const conditions = (fmh.condition || []).map((c: { code?: { text?: string; coding?: { display?: string }[] } }) => c.code?.text || c.code?.coding?.[0]?.display).filter(Boolean);
        const deceased   = fmh.deceasedBoolean ? 'Deceased' : '';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-gray">👪</div>
            <div className="row-body">
              <div className="row-title">{rel}</div>
              {conditions.length > 0 && <div className="row-detail">{conditions.join(', ')}</div>}
              {deceased           && <div className="row-detail">{deceased}</div>}
            </div>
            <div className="row-aside"><span className="tag tag-gray">{cap(status)}</span></div>
          </div>
        );
      })}
    </div>
  );
}
