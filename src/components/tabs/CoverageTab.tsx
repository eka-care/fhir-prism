import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function CoverageTab() {
  const { resourceMap } = useFhir();
  const list = resourceMap['Coverage'] || [];
  if (!list.length) return <div className="empty-state">No coverage / insurance data.</div>;

  return (
    <div className="card">
      {list.map((cov, i) => {
        const type      = cov.type?.coding?.[0]?.display || cov.type?.text || 'Coverage';
        const status    = cov.status || '—';
        const subId     = cov.subscriberId || '';
        const payor     = (cov.payor || []).map((p: { display?: string }) => p.display).filter(Boolean).join(', ');
        const start     = (cov.period?.start || '').slice(0, 10);
        const end       = (cov.period?.end   || '').slice(0, 10);
        const period    = start ? (end ? `${start} – ${end}` : `From ${start}`) : '—';
        const tagClass  = status === 'active' ? 'tag-green' : status === 'cancelled' ? 'tag-red' : 'tag-gray';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-teal">🛡</div>
            <div className="row-body">
              <div className="row-title">{type}</div>
              {payor   && <div className="row-detail">Payor: {payor}</div>}
              {subId   && <div className="row-detail">Subscriber ID: {subId}</div>}
              {period  && <div className="row-detail">Period: {period}</div>}
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
