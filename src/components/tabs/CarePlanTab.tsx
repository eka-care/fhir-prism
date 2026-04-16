import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function CarePlanTab() {
  const { resourceMap } = useFhir();
  const plans = resourceMap['CarePlan'] || [];
  const goals = resourceMap['Goal']     || [];

  if (!plans.length && !goals.length) return <div className="empty-state">No care plan data.</div>;

  return (
    <>
      {plans.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Care Plans</div>
          <div className="card">
            {plans.map((plan, i) => {
              const title = plan.title || plan.description || 'Care Plan';
              const status = plan.status || '—';
              const activities = (plan.activity || [])
                .map((a: { detail?: { code?: { text?: string; coding?: { display?: string }[] } }; reference?: { display?: string } }) =>
                  a.detail?.code?.text || a.detail?.code?.coding?.[0]?.display || a.reference?.display)
                .filter(Boolean);
              return (
                <div key={i} className="card-row">
                  <div className="row-icon icon-purple">📋</div>
                  <div className="row-body">
                    <div className="row-title">{title}</div>
                    {activities.length > 0 && <div className="row-detail">{activities.join(', ')}</div>}
                  </div>
                  <div className="row-aside"><span className="tag tag-purple">{cap(status)}</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {goals.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Goals</div>
          <div className="card">
            {goals.map((goal, i) => {
              const desc = goal.description?.text || goal.description?.coding?.[0]?.display || '—';
              const lifecycle = goal.lifecycleStatus || '—';
              return (
                <div key={i} className="card-row">
                  <div className="row-icon icon-green">🎯</div>
                  <div className="row-body"><div className="row-title">{desc}</div></div>
                  <div className="row-aside"><span className="tag tag-green">{cap(lifecycle)}</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
