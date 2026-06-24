import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';
import type { FhirCoverageEligibilityRequest } from '../../lib/types';

export function EligibilityRequestTab() {
  const { resourceMap } = useFhir();
  const list = (resourceMap['CoverageEligibilityRequest'] || []) as FhirCoverageEligibilityRequest[];
  if (!list.length) return <div className="empty-state">No eligibility requests.</div>;

  return (
    <div className="card">
      {list.map((e, i) => {
        const num      = e.identifier?.[0]?.value || e.id || '—';
        const status   = e.status || '—';
        const purposes = (e.purpose || []).map(cap).join(', ') || '—';
        const insurer  = e.insurer?.display || e.insurer?.reference || '';
        const prov     = e.provider?.display || e.provider?.reference || '';
        const created  = (e.created || '').slice(0, 10);
        const start    = (e.servicedPeriod?.start || '').slice(0, 10);
        const end      = (e.servicedPeriod?.end || '').slice(0, 10);
        const serviced = e.servicedDate ? e.servicedDate.slice(0, 10) : start ? (end ? `${start} – ${end}` : `From ${start}`) : '';
        const coverage = (e.insurance || []).map(ins => ins.coverage?.display || ins.coverage?.reference).filter(Boolean).join(', ');
        const tagClass = status === 'active' ? 'tag-green' : 'tag-gray';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-blue">🛡</div>
            <div className="row-body">
              <div className="row-title">Eligibility · {purposes}</div>
              <div className="row-detail">Request no.: {num}{created && ` · ${created}`}</div>
              {insurer   && <div className="row-detail">Insurer: {insurer}</div>}
              {prov      && <div className="row-detail">Provider: {prov}</div>}
              {coverage  && <div className="row-detail">Coverage: {coverage}</div>}
              {serviced  && <div className="row-detail">Serviced: {serviced}</div>}
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
