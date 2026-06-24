import { useMemo, useState } from 'react';
import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';
import { buildInsurancePlanView } from '../../lib/insurancePlan';
import type { PlanBenefitView, PlanDocReq } from '../../lib/insurancePlan';
import type { FhirResource } from '../../lib/types';

function DocChips({ docs }: { docs: PlanDocReq[] }) {
  if (!docs.length) return null;
  return (
    <div className="prism-flex prism-flex-wrap prism-gap-5" style={{ marginTop: 4 }}>
      {docs.map((d, i) => (
        <span key={i} className="tag tag-blue" title={d.category}>
          📄 {d.code || d.category}
        </span>
      ))}
    </div>
  );
}

function BenefitRow({ b }: { b: PlanBenefitView }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '0.5px solid var(--c-border)' }}>
      <div className="prism-flex prism-items-start prism-justify-between prism-gap-10">
        <div style={{ fontSize: 13 }}>
          {b.name}
          <span style={{ fontSize: 11, color: 'var(--c-text3)', fontFamily: 'var(--font-mono)', marginLeft: 6 }}>{b.code}</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, whiteSpace: 'nowrap' }}>
          {b.cost && <div style={{ fontWeight: 600 }}>{b.cost}</div>}
          {b.limit && <div style={{ color: 'var(--c-text3)' }}>Limit: {b.limit}</div>}
        </div>
      </div>

      {b.conditions.length > 0 && (
        <div className="prism-flex prism-flex-wrap prism-gap-5" style={{ marginTop: 4 }}>
          {b.conditions.map((c, i) => (
            <span key={i} className="tag tag-gray" style={{ fontSize: 10 }}>{c.label}: {c.value}</span>
          ))}
        </div>
      )}

      <DocChips docs={b.docs} />

      {b.stgRefs.length > 0 && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--c-text2)' }}>
          {b.stgRefs.map((r, i) => (
            <div key={i}>🧾 STG: <span style={{ fontFamily: 'var(--font-mono)' }}>{r.split('/').pop()}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InsurancePlanTab() {
  const { resourceMap } = useFhir();
  const list = useMemo(() => (resourceMap['InsurancePlan'] || []) as FhirResource[], [resourceMap]);
  const view = useMemo(() => list.map(buildInsurancePlanView), [list]);
  // Track which categories are expanded so we render 3000+ benefit rows lazily.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!list.length) return <div className="empty-state">No insurance plan.</div>;

  return (
    <>
      {view.map((ip, i) => {
        const tagClass = ip.status === 'active' ? 'tag-green' : ip.status === 'retired' ? 'tag-red' : 'tag-gray';
        return (
          <div key={i} className="card" style={{ marginBottom: 16 }}>
            {/* Header */}
            <div className="card-row">
              <div className="row-icon icon-teal">🛡</div>
              <div className="row-body">
                <div className="row-title">{ip.name}</div>
                <div className="row-detail">{ip.type}</div>
                {ip.period && <div className="row-detail">Validity: {ip.period}</div>}
                {ip.owner  && <div className="row-detail">Owned by: {ip.owner}</div>}
                {ip.admin && ip.admin !== ip.owner && <div className="row-detail">Administered by: {ip.admin}</div>}
                {(ip.planType || ip.sumInsured) && (
                  <div className="row-detail">
                    Plan: {ip.planType || '—'}{ip.sumInsured && ` · Sum insured ${ip.sumInsured}`}
                  </div>
                )}
              </div>
              <div className="row-aside">
                <span className={`tag ${tagClass}`}>{cap(ip.status)}</span>
                {ip.tariffVersion && (
                  <div className="row-detail" style={{ marginTop: 6, fontSize: 11 }}>Tariff: {ip.tariffVersion}</div>
                )}
              </div>
            </div>

            {/* Identifiers / tariff version */}
            {ip.identifiers.length > 0 && (
              <div style={{ padding: '0 16px 10px' }}>
                <div className="row-detail" style={{ fontWeight: 600, marginBottom: 4 }}>Identifiers</div>
                {ip.identifiers.map((id, j) => (
                  <div key={j} className="row-detail">{id.label}: <span style={{ fontFamily: 'var(--font-mono)' }}>{id.value}</span></div>
                ))}
              </div>
            )}

            {/* Policy-level mandatory documents */}
            {ip.policyDocs.length > 0 && (
              <div style={{ padding: '0 16px 12px' }}>
                <div className="row-detail" style={{ fontWeight: 600, marginBottom: 4 }}>
                  Policy-level mandatory documents
                </div>
                <DocChips docs={ip.policyDocs} />
              </div>
            )}

            {/* Covered benefit categories */}
            {ip.categories.length > 0 && (
              <div style={{ padding: '0 16px 14px' }}>
                <div className="row-detail" style={{ fontWeight: 600, marginBottom: 6 }}>
                  Covered benefit categories ({ip.categories.length}) · {ip.benefitCount} benefits
                </div>
                <div className="card" style={{ padding: 0 }}>
                  {ip.categories.map((cat, k) => {
                    const key = `${i}:${k}`;
                    const isOpen = !!open[key];
                    return (
                      <details
                        key={k}
                        style={{ borderBottom: '0.5px solid var(--c-border)' }}
                        onToggle={e => setOpen(o => ({ ...o, [key]: (e.target as HTMLDetailsElement).open }))}
                      >
                        <summary style={{ cursor: 'pointer', padding: '9px 12px', listStyle: 'revert' }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--c-text3)', marginLeft: 8 }}>
                            {cat.code && <span style={{ fontFamily: 'var(--font-mono)' }}>{cat.code}</span>} · {cat.benefits.length} benefit{cat.benefits.length === 1 ? '' : 's'}
                          </span>
                        </summary>
                        <div style={{ padding: '0 12px 10px' }}>
                          {isOpen
                            ? (cat.benefits.length
                                ? cat.benefits.map((b, m) => <BenefitRow key={m} b={b} />)
                                : <div className="row-detail">No benefits.</div>)
                            : null}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
