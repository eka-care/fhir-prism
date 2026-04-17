import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function EncountersTab() {
  const { resourceMap } = useFhir();
  const compositions = resourceMap['Composition'] || [];
  const encounters   = resourceMap['Encounter']   || [];

  if (!compositions.length && !encounters.length) return <div className="empty-state">No encounters.</div>;

  return (
    <>
      {compositions.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Compositions</div>
          <div className="card">
            {compositions.map((comp, i) => {
              const profile = (comp.meta?.profile || [])[0] || '';
              const short   = profile.split('/').pop() || 'Composition';
              return (
                <div key={i} className="card-row">
                  <div className="row-icon icon-blue">D</div>
                  <div className="row-body">
                    <div className="row-title">{comp.title || comp.type?.text || 'Composition'}</div>
                    <div className="row-detail">{comp.custodian?.display || '—'}</div>
                    <div className="row-code">{short}</div>
                  </div>
                  <div className="row-aside">
                    <span className="tag tag-green">{cap(comp.status || '—')}</span>
                    <div className="row-date">{(comp.date || '').slice(0, 10)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {encounters.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Encounters</div>
          <div className="card">
            {encounters.map((enc, i) => {
              const type       = (enc.type || []).map((t: { text?: string; coding?: { display?: string }[] }) => t.text || t.coding?.[0]?.display).filter(Boolean).join(', ') || cap(enc.class?.code || 'Encounter');
              const classCode  = enc.class?.code || '';
              const iconClass  = classCode === 'IMP' || classCode === 'inpatient' ? 'icon-red' : classCode === 'EMER' ? 'icon-amber' : 'icon-blue';
              const abbr       = classCode === 'IMP' ? 'IP' : classCode === 'EMER' ? 'ER' : 'OP';
              const reason     = (enc.reasonCode || []).map((r: { text?: string; coding?: { display?: string }[] }) => r.text || r.coding?.[0]?.display).join(', ');
              const encId      = enc.identifier?.[0]?.value || '';
              const start      = (enc.period?.start || '').slice(0, 10);
              const tagClass   = enc.status === 'in-progress' ? 'tag-red' : enc.status === 'finished' ? 'tag-gray' : 'tag-amber';

              return (
                <div key={i} className="card-row">
                  <div className={`row-icon ${iconClass}`}>{abbr}</div>
                  <div className="row-body">
                    <div className="row-title">{type}</div>
                    <div className="row-detail">{[reason, encId ? `#${encId}` : ''].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="row-aside">
                    <span className={`tag ${tagClass}`}>{cap(enc.status || '—')}</span>
                    <div className="row-date">{start}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
