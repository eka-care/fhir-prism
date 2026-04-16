import { useFhir } from '../../context/FhirContext';
import { getObservationValue, getObservationReferenceRange, getComponentValue, isVitalObservation, isLabObservation, cap } from '../../lib/helpers';
import { VITAL_REFERENCE_RANGES } from '../../lib/constants';
import type { FhirObservation } from '../../lib/types';

export function ObservationsTab() {
  const { resourceMap } = useFhir();
  const all     = (resourceMap['Observation'] || []) as FhirObservation[];
  if (!all.length) return <div className="empty-state">No observations.</div>;

  const vitals  = all.filter(isVitalObservation);
  const labs    = all.filter(o => isLabObservation(o) && !isVitalObservation(o));
  const notes   = all.filter(o => (o.valueString || o.note?.length) && !isVitalObservation(o) && !isLabObservation(o));
  const others  = all.filter(o => !isVitalObservation(o) && !isLabObservation(o) && !notes.includes(o));

  return (
    <>
      {/* Vital signs grid */}
      {vitals.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 10 }}>Vital Signs</div>
          <div className="vitals-grid" style={{ marginBottom: 16 }}>
            {vitals.map((obs, i) => {
              const name   = obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown';
              const unit   = obs.valueQuantity?.unit || '';
              const value  = obs.component
                ? obs.component.map(c => c.valueQuantity?.value?.toFixed(0)).filter(Boolean).join('/')
                : obs.valueQuantity?.value != null ? String(obs.valueQuantity.value) : getObservationValue(obs);
              const num    = parseFloat(value);
              const interp = obs.interpretation?.[0]?.coding?.[0]?.code || 'N';
              const ref    = VITAL_REFERENCE_RANGES[name.toLowerCase()];
              const isH    = ['H', 'HH'].includes(interp) || !!(ref?.high && num > ref.high);
              const isL    = ['L', 'LL'].includes(interp) || !!(ref?.low  && num < ref.low);
              return (
                <div key={i} className="vital-card">
                  <div className="vital-label">{name}</div>
                  <div className={`vital-value ${isH ? 'vital-high' : isL ? 'vital-low' : ''}`}>{value}</div>
                  <div className="vital-unit">{unit}</div>
                  {isH && <div className="vital-flag"><span className="tag tag-red">↑ High</span></div>}
                  {isL && <div className="vital-flag"><span className="tag tag-amber">↓ Low</span></div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Lab values table */}
      {labs.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Lab Values</div>
          <div className="card" style={{ marginBottom: 16 }}>
            <table className="lab-table">
              <thead><tr><th>Test</th><th>Result</th><th>Reference Range</th><th>Flag</th><th>Date</th></tr></thead>
              <tbody>
                {labs.map((obs, i) => {
                  const name    = obs.code?.text || obs.code?.coding?.[0]?.display || '—';
                  const val     = getObservationValue(obs);
                  const unit    = obs.valueQuantity?.unit || '';
                  const ref     = getObservationReferenceRange(obs);
                  const date    = (obs.effectiveDateTime || obs.issued || '').slice(0, 10);
                  const interp  = obs.interpretation?.[0]?.coding?.[0]?.code || 'N';
                  const abnorm  = ['H', 'L', 'HH', 'LL', 'A', 'AA'].includes(interp);
                  const isH     = interp.startsWith('H');
                  return (
                    <tr key={i}>
                      <td>{name}</td>
                      <td className={abnorm ? 'lab-value-abnormal' : 'lab-value-normal'}>
                        {val} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--c-text2)' }}>{unit}</span>
                      </td>
                      <td style={{ color: 'var(--c-text2)' }}>{ref}</td>
                      <td>{abnorm ? <span className={`tag ${isH ? 'tag-red' : 'tag-amber'}`}>{isH ? '↑ High' : '↓ Low'}</span> : <span className="tag tag-green">Normal</span>}</td>
                      <td style={{ color: 'var(--c-text3)' }}>{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Clinical notes */}
      {notes.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Clinical Notes</div>
          <div className="card" style={{ marginBottom: 16 }}>
            {notes.map((obs, i) => (
              <div key={i} className="card-row">
                <div className="row-icon icon-purple">N</div>
                <div className="row-body">
                  <div className="row-title">{obs.code?.text || obs.code?.coding?.[0]?.display || 'Note'}</div>
                  {(obs.valueString || (obs.note || []).map((n: { text?: string }) => n.text).join(' ')) &&
                    <div className="row-detail">{obs.valueString || (obs.note || []).map((n: { text?: string }) => n.text).join(' ')}</div>}
                  {(obs.component || []).map((c, j) => (
                    <div key={j} className="row-detail">
                      {c.code?.text && <span style={{ color: 'var(--c-text2)' }}>{c.code.text}: </span>}
                      {getComponentValue(c)}
                    </div>
                  ))}
                </div>
                <div className="row-aside row-date">{(obs.effectiveDateTime || '').slice(0, 10)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Other observations */}
      {others.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Other Observations</div>
          <div className="card">
            {others.map((obs, i) => {
              const val  = getObservationValue(obs);
              const unit = obs.valueQuantity?.unit || '';
              const date = (obs.effectiveDateTime || '').slice(0, 10);
              return (
                <div key={i} className="card-row">
                  <div className="row-icon icon-gray">O</div>
                  <div className="row-body">
                    <div className="row-title">{obs.code?.text || obs.code?.coding?.[0]?.display || '—'}</div>
                    {obs.component?.length ? obs.component.map((c, j) => (
                      <div key={j} className="row-detail">
                        {c.code?.text && <span style={{ color: 'var(--c-text2)' }}>{c.code.text}: </span>}
                        {getComponentValue(c)}
                      </div>
                    )) : <div className="row-detail">{val}{unit ? ` ${unit}` : ''}</div>}
                  </div>
                  <div className="row-aside row-date">{date}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// silence unused import
void cap;
