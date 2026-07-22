import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';
import type { FhirCoverageEligibilityResponse, FhirEligibilityBenefit } from '../../lib/types';

const benefitAmount = (b: FhirEligibilityBenefit, key: 'allowed' | 'used'): string => {
  const m = key === 'allowed' ? b.allowedMoney : b.usedMoney;
  const n = key === 'allowed' ? b.allowedUnsignedInt : b.usedUnsignedInt;
  if (m?.value != null) return `${m.currency === 'INR' ? '₹' : (m.currency ? m.currency + ' ' : '')}${m.value.toFixed(2)}`;
  if (n != null) return String(n);
  if (key === 'allowed' && b.allowedString) return b.allowedString;
  return '';
};

export function EligibilityResponseTab() {
  const { resourceMap } = useFhir();
  const list = (resourceMap['CoverageEligibilityResponse'] || []) as FhirCoverageEligibilityResponse[];
  if (!list.length) return <div className="empty-state">No eligibility responses.</div>;

  return (
    <>
      {list.map((e, i) => {
        const num      = e.identifier?.[0]?.value || e.id || '—';
        const purposes = (e.purpose || []).map(cap).join(', ') || '—';
        const outcome  = e.outcome || '—';
        const created  = (e.created || '').slice(0, 10);
        const insurer  = e.insurer?.display || e.insurer?.reference || '';
        const tagClass = outcome === 'complete' ? 'tag-green' : outcome === 'error' ? 'tag-red' : 'tag-gray';

        return (
          <div key={i} className="card" style={{ marginBottom: 16 }}>
            <div className="card-row">
              <div className="row-icon icon-teal">🛡</div>
              <div className="row-body">
                <div className="row-title">Eligibility Response · {purposes}</div>
                <div className="row-detail">Response no.: {num}{created && ` · ${created}`}</div>
                {insurer       && <div className="row-detail">Insurer: {insurer}</div>}
                {e.disposition && <div className="row-detail">Disposition: {e.disposition}</div>}
              </div>
              <div className="row-aside"><span className={`tag ${tagClass}`}>{cap(outcome)}</span></div>
            </div>

            {(e.insurance || []).map((ins, j) => (
              <div key={j} style={{ padding: '0 16px 12px' }}>
                <div className="row-detail" style={{ fontWeight: 600 }}>
                  {ins.coverage?.display || ins.coverage?.reference || 'Coverage'}
                  {ins.inforce != null && ` · ${ins.inforce ? 'in force' : 'not in force'}`}
                </div>
                {(ins.item || []).map((it, k) => {
                  const name = it.name || it.productOrService?.text || it.productOrService?.coding?.[0]?.display
                    || it.category?.text || it.category?.coding?.[0]?.display || 'Benefit';
                  return (
                    <div key={k} className="row-detail" style={{ marginLeft: 8 }}>
                      • {name}{it.excluded ? ' (excluded)' : ''}
                      {(it.benefit || []).map((b, l) => {
                        const label   = b.type?.coding?.[0]?.display || b.type?.text || 'benefit';
                        const allowed = benefitAmount(b, 'allowed');
                        const used    = benefitAmount(b, 'used');
                        return (
                          <span key={l}>
                            {' — '}{label}{allowed && `: allowed ${allowed}`}{used && `, used ${used}`}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
