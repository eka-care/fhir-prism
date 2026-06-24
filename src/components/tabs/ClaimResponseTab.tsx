import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';
import type { FhirClaimResponse } from '../../lib/types';

const money = (m?: { value?: number; currency?: string }) =>
  m?.value == null ? '—' : `${m.currency === 'INR' ? '₹' : (m.currency ? m.currency + ' ' : '')}${m.value.toFixed(2)}`;

export function ClaimResponseTab() {
  const { resourceMap } = useFhir();
  const list = (resourceMap['ClaimResponse'] || []) as FhirClaimResponse[];
  if (!list.length) return <div className="empty-state">No claim responses.</div>;

  return (
    <div className="card">
      {list.map((r, i) => {
        const num      = r.identifier?.[0]?.value || r.id || '—';
        const type     = r.type?.coding?.[0]?.display || r.type?.text || 'Claim Response';
        const outcome  = r.outcome || '—';
        const created  = (r.created || '').slice(0, 10);
        const insurer  = r.insurer?.display || r.insurer?.reference || '';
        const tagClass = outcome === 'complete' ? 'tag-green' : outcome === 'error' ? 'tag-red' : outcome === 'partial' ? 'tag-amber' : 'tag-gray';
        const errors   = (r.error || []).map(e => e.code?.text || e.code?.coding?.[0]?.display).filter(Boolean);

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-green">🏥</div>
            <div className="row-body">
              <div className="row-title">{type}</div>
              <div className="row-detail">Response no.: {num}{created && ` · ${created}`}</div>
              {insurer       && <div className="row-detail">Insurer: {insurer}</div>}
              {r.disposition && <div className="row-detail">Disposition: {r.disposition}</div>}
              {(r.total || []).map((t, j) => (
                <div key={j} className="row-detail">
                  {(t.category?.coding?.[0]?.display || t.category?.text || 'Total')}: {money(t.amount)}
                </div>
              ))}
              {r.payment?.amount?.value != null && (
                <div className="row-detail">Payment: {money(r.payment.amount)}{r.payment.date ? ` on ${r.payment.date.slice(0, 10)}` : ''}</div>
              )}
              {errors.length > 0 && <div className="row-detail" style={{ color: 'var(--c-red, #c00)' }}>Errors: {errors.join(', ')}</div>}
            </div>
            <div className="row-aside">
              <span className={`tag ${tagClass}`}>{cap(outcome)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
