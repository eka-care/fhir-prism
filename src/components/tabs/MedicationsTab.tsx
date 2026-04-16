import { useFhir } from '../../context/FhirContext';
import { getMedicationName, getMedicationStatusStyle, buildTimingText, cap } from '../../lib/helpers';

export function MedicationsTab() {
  const { resourceMap } = useFhir();
  const requests   = (resourceMap['MedicationRequest']  || []).map(r => ({ ...r, _src: 'request'   }));
  const statements = (resourceMap['MedicationStatement'] || []).map(s => ({ ...s, _src: 'statement' }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = [...requests, ...statements] as any[];

  if (!all.length) return <div className="empty-state">No medications.</div>;

  return (
    <>
      {all.map((med, idx) => {
        const name         = getMedicationName(med);
        const status       = med.status || 'unknown';
        const prescribed   = med.authoredOn?.slice(0, 10) || '';
        const notes        = ((med.note || []).map((n: { text?: string }) => n.text).filter(Boolean)) as string[];
        const { tagClass } = getMedicationStatusStyle(status);
        const dispQty      = med.dispenseRequest?.quantity;
        const dispText     = dispQty ? `${dispQty.value ?? ''} ${dispQty.unit || ''}`.trim() : '';
        const vp           = med.dispenseRequest?.validityPeriod;
        const duration     = vp
          ? `${vp.start?.slice(0, 10) || ''} → ${vp.end?.slice(0, 10) || ''}`.replace(/^ → $/, '').trim()
          : '';

        const rows: { label: string; value: string }[] = [];
        (med.dosageInstruction || []).forEach((d: { text?: string; additionalInstruction?: { text?: string; coding?: { display?: string }[] }[]; doseAndRate?: { doseQuantity?: { value?: number; unit?: string } }[]; route?: { text?: string; coding?: { display?: string }[] }; timing?: unknown }) => {
          if (d.text) rows.push({ label: 'Instructions', value: d.text });
          const sched = (d.additionalInstruction || []).map((ai: { text?: string; coding?: { display?: string }[] }) => ai.text || ai.coding?.[0]?.display).filter(Boolean).join(', ');
          if (sched) rows.push({ label: 'Schedule', value: sched });
          const dose = d.doseAndRate?.[0]?.doseQuantity;
          if (dose?.value != null) rows.push({ label: 'Dose', value: `${dose.value} ${dose.unit || ''}`.trim() });
          const route = d.route?.text || d.route?.coding?.[0]?.display || '';
          if (route) rows.push({ label: 'Route', value: route });
          const timing = buildTimingText(d.timing);
          if (timing) rows.push({ label: 'Frequency', value: timing });
          const bounds = (d.timing as { repeat?: { boundsDuration?: { value?: number; unit?: string } } })?.repeat?.boundsDuration;
          if (bounds?.value != null) rows.push({ label: 'For', value: `${bounds.value} ${bounds.unit || ''}`.trim() });
        });

        return (
          <div key={idx} className="rx-card">
            <div className="rx-header">
              <div className="rx-symbol">℞</div>
              <div className="rx-drug">
                {name}
                {dispText && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--c-text2)', marginLeft: 8 }}>{dispText}</span>}
              </div>
              <span className={`tag ${tagClass}`}>{cap(status)}</span>
            </div>
            <div className="rx-body">
              {rows.map((r, i) => (
                <div key={i}>
                  <div className="rx-label">{r.label}</div>
                  <div className="rx-value">{r.value}</div>
                </div>
              ))}
              {duration    && <div><div className="rx-label">Duration</div><div className="rx-value">{duration}</div></div>}
              {prescribed  && <div><div className="rx-label">Prescribed</div><div className="rx-value">{prescribed}</div></div>}
            </div>
            {notes.length > 0 && (
              <div className="rx-note">{notes.map(n => `• ${n}`).join('\n')}</div>
            )}
          </div>
        );
      })}
    </>
  );
}
