import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function ProceduresTab() {
  const { resourceMap } = useFhir();
  const list = resourceMap['Procedure'] || [];
  if (!list.length) return <div className="empty-state">No procedures.</div>;

  return (
    <div className="card">
      {list.map((proc, i) => {
        const name      = proc.code?.text || proc.code?.coding?.[0]?.display || '—';
        const status    = proc.status || '—';
        const date      = (proc.performedDateTime || proc.performedPeriod?.start || '').slice(0, 10);
        const performer = (proc.performer || []).map((p: { actor?: { display?: string } }) => p.actor?.display).filter(Boolean).join(', ');
        const note      = (proc.note || []).map((n: { text?: string }) => n.text).join('; ');
        const body      = (proc.bodySite || []).map((b: { text?: string; coding?: { display?: string }[] }) => b.text || b.coding?.[0]?.display).filter(Boolean).join(', ');
        const detail    = [performer, body, note].filter(Boolean).join(' · ');

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-teal">⚕</div>
            <div className="row-body">
              <div className="row-title">{name}</div>
              {detail && <div className="row-detail">{detail}</div>}
            </div>
            <div className="row-aside">
              <span className="tag tag-gray">{cap(status)}</span>
              <div className="row-date">{date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
