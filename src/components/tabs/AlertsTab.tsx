import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function AlertsTab() {
  const { resourceMap } = useFhir();
  const flags = resourceMap['Flag'] || [];
  if (!flags.length) return <div className="empty-state">No alerts or flags.</div>;

  return (
    <div className="card">
      {flags.map((flag, i) => {
        const label    = flag.code?.text || flag.code?.coding?.[0]?.display || 'Alert';
        const status   = flag.status || '—';
        const start    = (flag.period?.start || '').slice(0, 10);
        const end      = (flag.period?.end   || '').slice(0, 10);
        const period   = start ? (end ? `${start} – ${end}` : `From ${start}`) : '';
        const tagClass = status === 'active' ? 'tag-red' : 'tag-gray';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-amber">🔔</div>
            <div className="row-body">
              <div className="row-title">{label}</div>
              {period && <div className="row-detail">{period}</div>}
            </div>
            <div className="row-aside">
              <span className={`tag ${tagClass}`}>{cap(status)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
