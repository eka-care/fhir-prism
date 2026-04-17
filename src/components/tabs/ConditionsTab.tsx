import { useFhir } from '../../context/FhirContext';
import { getConditionLabel, getConditionStatusStyle, cap } from '../../lib/helpers';
import type { FhirResource } from '../../lib/types';

function ConditionGroup({ title, conditions }: { title: string; conditions: FhirResource[] }) {
  return (
    <>
      <div className="section-label" style={{ marginBottom: 8 }}>{title}</div>
      <div className="card">
        {conditions.map((cond, i) => {
          const status     = cond.clinicalStatus?.coding?.[0]?.code || 'unknown';
          const codings    = cond.code?.coding || [];
          const codeStr    = codings.map((c: { code?: string }) => c.code).filter(Boolean).join(' · ');
          const sys        = codings[0]?.system || '';
          const sysLabel   = sys.includes('icd') ? 'ICD-10' : sys.includes('snomed') ? 'SNOMED' : '';
          const onset      = cond.onsetDateTime?.slice(0, 10) || cond.onsetPeriod?.start?.slice(0, 10) || '';
          const note       = (cond.note || []).map((n: { text?: string }) => n.text).join('; ');
          const verifCode  = cond.verificationStatus?.coding?.[0]?.code || '';
          const category   = (cond.category || []).map((c: { text?: string; coding?: { display?: string }[] }) => c.text || c.coding?.[0]?.display).filter(Boolean).join(', ');
          const { iconClass, tagClass } = getConditionStatusStyle(status);
          return (
            <div key={i} className="card-row">
              <div className={`row-icon ${iconClass}`} style={{ fontSize: 10 }}>{status === 'active' ? 'Dx' : 'Hx'}</div>
              <div className="row-body">
                <div className="row-title">{getConditionLabel(cond)}</div>
                {category && <div className="row-detail">{category}</div>}
                {note      && <div className="row-detail" style={{ fontStyle: 'italic' }}>{note}</div>}
                {codeStr   && <div className="row-code">{sysLabel ? `${sysLabel}: ` : ''}{codeStr}</div>}
              </div>
              <div className="row-aside">
                <span className={`tag ${tagClass}`}>{cap(status)}</span>
                {verifCode && verifCode !== 'confirmed' && (
                  <><br /><span className="tag tag-amber" style={{ marginTop: 3 }}>{cap(verifCode)}</span></>
                )}
                <div className="row-date">{onset ? `Since ${onset}` : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ConditionsTab() {
  const { resourceMap } = useFhir();
  const all      = resourceMap['Condition'] || [];
  const active   = all.filter(c => c.clinicalStatus?.coding?.[0]?.code === 'active');
  const resolved = all.filter(c => c.clinicalStatus?.coding?.[0]?.code !== 'active');

  if (!all.length) return <div className="empty-state">No conditions.</div>;
  return (
    <>
      {active.length   > 0 && <ConditionGroup title="Active / Ongoing"      conditions={active} />}
      {resolved.length > 0 && <ConditionGroup title="Resolved / Historical" conditions={resolved} />}
    </>
  );
}
