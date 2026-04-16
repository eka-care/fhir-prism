import { useFhir } from '../../context/FhirContext';
import { getConditionLabel, getMedicationName, getKeyVitals } from '../../lib/helpers';

export function OverviewTab() {
  const { resourceMap } = useFhir();
  const conditions   = resourceMap['Condition']           || [];
  const medications  = resourceMap['MedicationRequest']   || [];
  const allergies    = resourceMap['AllergyIntolerance']  || [];
  const invoices     = resourceMap['Invoice']             || [];
  const keyVitals    = getKeyVitals(resourceMap);
  const clinicalNotes = (resourceMap['Observation'] || []).filter(
    (obs) => obs['valueString'] || (obs['note'] as unknown[] | undefined)?.length
  );

  return (
    <div className="prism-grid prism-gap-12 prism-mb-14" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>

      {/* Diagnoses */}
      <div className="overview-section">
        <div className="overview-title">Diagnoses / Conditions</div>
        {conditions.length ? (
          <div className="overview-body">
            {conditions.slice(0, 6).map((cond, i) => {
              const status = cond.clinicalStatus?.coding?.[0]?.code || 'active';
              const dot = status === 'active' ? 'var(--c-red)' : 'var(--c-text3)';
              const code = cond.code?.coding?.[0]?.code || '';
              return (
                <div key={i} className="overview-item">
                  <div className="overview-dot" style={{ background: dot }} />
                  <div>
                    <div style={{ fontSize: 13 }}>{getConditionLabel(cond)}</div>
                    {code && <div style={{ fontSize: 11, color: 'var(--c-text3)', fontFamily: 'var(--font-mono)' }}>{code}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="overview-empty">No conditions recorded</div>}
      </div>

      {/* Medications */}
      <div className="overview-section">
        <div className="overview-title">Medications</div>
        {medications.length ? (
          <div className="overview-body">
            {medications.slice(0, 6).map((med, i) => {
              const dosage = med.dosageInstruction?.[0]?.text || '';
              return (
                <div key={i} className="overview-item">
                  <div className="overview-dot" style={{ background: 'var(--c-green)' }} />
                  <div>
                    <div style={{ fontSize: 13 }}>{getMedicationName(med)}</div>
                    {dosage && <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{dosage}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="overview-empty">No medications prescribed</div>}
      </div>

      {/* Key Vitals */}
      {keyVitals.length > 0 && (
        <div className="overview-section">
          <div className="overview-title">Key Vitals</div>
          <div className="overview-body">
            {keyVitals.map((v, i) => (
              <div key={i} className="overview-item">
                <div className="overview-dot" style={{ background: v.isHigh ? 'var(--c-red)' : v.isLow ? 'var(--c-amber)' : 'var(--c-blue)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {v.value} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--c-text2)' }}>{v.unit}</span>
                    {v.isHigh && <> <span className="tag tag-red" style={{ fontSize: 10 }}>High</span></>}
                    {v.isLow  && <> <span className="tag tag-amber" style={{ fontSize: 10 }}>Low</span></>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{v.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies */}
      {allergies.length > 0 && (
        <div className="overview-section">
          <div className="overview-title">Allergies</div>
          <div className="overview-body">
            {allergies.map((a, i) => {
              const sev = a.reaction?.[0]?.severity || a.criticality || '';
              const dot = ['severe', 'high'].includes(sev) ? 'var(--c-red)' : 'var(--c-amber)';
              const name = a.code?.text || a.code?.coding?.[0]?.display || '—';
              return (
                <div key={i} className="overview-item">
                  <div className="overview-dot" style={{ background: dot }} />
                  <div style={{ fontSize: 13 }}>{name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing */}
      {invoices.length > 0 && (
        <div className="overview-section">
          <div className="overview-title">Billing Summary</div>
          <div className="overview-body">
            <div className="overview-item">
              <div className="overview-dot" style={{ background: 'var(--c-teal)' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.5px' }}>
                  ₹{invoices.reduce((s, inv) => s + (inv.totalGross?.value || 0), 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{invoices.length} invoice{invoices.length > 1 ? 's' : ''}</div>
              </div>
            </div>
            {invoices.flatMap(inv => inv.lineItem || []).map((li, i) => {
              const rate = li.priceComponent?.find((pc: { type?: string }) => pc.type === 'base')?.amount?.value || 0;
              const desc = li.chargeItemReference?.display || li.chargeItemCodeableConcept?.text || '';
              return rate > 0 ? (
                <div key={i} className="overview-item">
                  <div className="overview-dot" style={{ background: 'var(--c-text3)' }} />
                  <div style={{ fontSize: 12, color: 'var(--c-text2)' }}>{desc} <span style={{ fontWeight: 500, color: 'var(--c-text)' }}>₹{rate.toFixed(2)}</span></div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Clinical Notes */}
      {clinicalNotes.length > 0 && (
        <div className="overview-section">
          <div className="overview-title">Clinical Notes</div>
          <div className="overview-body">
            {clinicalNotes.slice(0, 4).map((obs, i) => {
              const label = obs.code?.text || obs.code?.coding?.[0]?.display || '';
              const text  = obs.valueString || (obs.note || []).map((n: { text?: string }) => n.text).join(' ');
              return (
                <div key={i} className="overview-item">
                  <div className="overview-dot" style={{ background: 'var(--c-purple)' }} />
                  <div>
                    {label && <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{label}</div>}
                    <div style={{ fontSize: 12 }}>{text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
