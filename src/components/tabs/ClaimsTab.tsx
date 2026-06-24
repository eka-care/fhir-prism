import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';
import type { FhirClaim } from '../../lib/types';

const money = (m?: { value?: number; currency?: string }) =>
  m?.value == null ? '—' : `${m.currency === 'INR' ? '₹' : (m.currency ? m.currency + ' ' : '')}${m.value.toFixed(2)}`;

export function ClaimsTab() {
  const { resourceMap } = useFhir();
  const list = (resourceMap['Claim'] || []) as FhirClaim[];
  if (!list.length) return <div className="empty-state">No claims.</div>;

  return (
    <div className="card">
      {list.map((c, i) => {
        const num     = c.identifier?.[0]?.value || c.id || '—';
        const use     = c.use || 'claim';
        const type    = c.type?.coding?.[0]?.display || c.type?.text || 'Claim';
        const status  = c.status || '—';
        const insurer = c.insurer?.display || c.insurer?.reference || '';
        const prov    = c.provider?.display || c.provider?.reference || '';
        const created = (c.created || '').slice(0, 10);
        const start   = (c.billablePeriod?.start || '').slice(0, 10);
        const end     = (c.billablePeriod?.end || '').slice(0, 10);
        const period  = start ? (end ? `${start} – ${end}` : `From ${start}`) : '';
        const tagClass = status === 'active' ? 'tag-green' : status === 'cancelled' ? 'tag-red' : 'tag-gray';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-purple">🏥</div>
            <div className="row-body">
              <div className="row-title">{type} · {cap(use)}</div>
              <div className="row-detail">Claim no.: {num}{created && ` · ${created}`}</div>
              {insurer && <div className="row-detail">Insurer: {insurer}</div>}
              {prov    && <div className="row-detail">Provider: {prov}</div>}
              {period  && <div className="row-detail">Period: {period}</div>}
              {!!c.item?.length && (
                <div className="row-detail">
                  Items: {c.item.map(it => it.productOrService?.text || it.productOrService?.coding?.[0]?.display).filter(Boolean).join(', ') || c.item.length}
                </div>
              )}
            </div>
            <div className="row-aside">
              <span className={`tag ${tagClass}`}>{cap(status)}</span>
              {c.total?.value != null && <div className="row-detail" style={{ marginTop: 6, fontWeight: 600 }}>{money(c.total)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
