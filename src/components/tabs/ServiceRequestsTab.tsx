import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function ServiceRequestsTab() {
  const { resourceMap } = useFhir();
  const list = resourceMap['ServiceRequest'] || [];
  if (!list.length) return <div className="empty-state">No service requests.</div>;

  return (
    <div className="card">
      {list.map((sr, i) => {
        const name      = sr.code?.text || sr.code?.coding?.[0]?.display || '—';
        const status    = sr.status || '—';
        const intent    = sr.intent || '—';
        const date      = (sr.authoredOn || '').slice(0, 10);
        const requester = sr.requester?.display || '';
        const note      = (sr.note || []).map((n: { text?: string }) => n.text).join('; ');
        const priority  = sr.priority || '';
        const detail    = [cap(intent), requester, note].filter(Boolean).join(' · ');

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-blue">📋</div>
            <div className="row-body">
              <div className="row-title">{name}</div>
              {detail && <div className="row-detail">{detail}</div>}
            </div>
            <div className="row-aside">
              {priority === 'urgent' && <><span className="tag tag-red">Urgent</span><br /></>}
              <span className="tag tag-blue">{cap(status)}</span>
              <div className="row-date">{date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
