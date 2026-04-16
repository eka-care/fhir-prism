/**
 * tab-renderers.js
 * One render function per tab. Each function receives the tab's container
 * element and sets its innerHTML. No global DOM queries.
 * Depends on: constants.js, state.js, helpers.js.
 */

// ─── Overview ─────────────────────────────────────────────────────────────

function renderOverviewTab(container) {
  const conditions = resourceMap['Condition']           || [];
  const medications = resourceMap['MedicationRequest']  || [];
  const allergies   = resourceMap['AllergyIntolerance'] || [];
  const invoices    = resourceMap['Invoice']            || [];
  const keyVitals   = getKeyVitals();
  const clinicalNoteObservations = (resourceMap['Observation'] || []).filter(
    obs => obs.valueString || obs.note?.length
  );

  let html = '<div class="overview-grid">';

  // Diagnoses / Conditions
  html += `<div class="overview-section">
    <div class="overview-title">Diagnoses / Conditions</div>
    ${conditions.length ? `<div class="overview-body">${conditions.slice(0, 6).map(cond => {
      const clinicalStatus = (cond.clinicalStatus?.coding || [])[0]?.code || 'active';
      const dotColor = clinicalStatus === 'active' ? 'var(--red)' : 'var(--color-text3)';
      const icdCode = cond.code?.coding?.[0]?.code || '';
      return `<div class="overview-item">
        <div class="overview-dot" style="background:${dotColor}"></div>
        <div>
          <div style="font-size:13px">${getConditionLabel(cond)}</div>
          ${icdCode ? `<div style="font-size:11px;color:var(--color-text3);font-family:var(--font-mono)">${icdCode}</div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>` : '<div class="overview-empty">No conditions recorded</div>'}
  </div>`;

  // Medications
  html += `<div class="overview-section">
    <div class="overview-title">Medications</div>
    ${medications.length ? `<div class="overview-body">${medications.slice(0, 6).map(med => {
      const dosageText = (med.dosageInstruction || [])[0]?.text || '';
      return `<div class="overview-item">
        <div class="overview-dot" style="background:var(--green)"></div>
        <div>
          <div style="font-size:13px">${getMedicationName(med)}</div>
          ${dosageText ? `<div style="font-size:11px;color:var(--color-text3)">${dosageText}</div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>` : '<div class="overview-empty">No medications prescribed</div>'}
  </div>`;

  // Key vitals
  if (keyVitals.length) {
    html += `<div class="overview-section">
      <div class="overview-title">Key Vitals</div>
      <div class="overview-body">${keyVitals.map(vital => `
        <div class="overview-item">
          <div class="overview-dot" style="background:${vital.isHigh ? 'var(--red)' : vital.isLow ? 'var(--amber)' : 'var(--blue)'}"></div>
          <div>
            <div style="font-size:13px;font-weight:500">
              ${vital.value} <span style="font-size:11px;font-weight:400;color:var(--color-text2)">${vital.unit}</span>
              ${vital.isHigh ? ' <span class="tag tag-red" style="font-size:10px">High</span>' : ''}
              ${vital.isLow  ? ' <span class="tag tag-amber" style="font-size:10px">Low</span>'  : ''}
            </div>
            <div style="font-size:11px;color:var(--color-text3)">${vital.label}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  // Allergies
  if (allergies.length) {
    html += `<div class="overview-section">
      <div class="overview-title">Allergies</div>
      <div class="overview-body">${allergies.map(allergy => {
        const severity = (allergy.reaction || [])[0]?.severity || allergy.criticality || '';
        const dotColor = ['severe', 'high'].includes(severity) ? 'var(--red)' : 'var(--amber)';
        const allergenName = allergy.code?.text || (allergy.code?.coding || [])[0]?.display || '—';
        return `<div class="overview-item">
          <div class="overview-dot" style="background:${dotColor}"></div>
          <div style="font-size:13px">${allergenName}</div>
        </div>`;
      }).join('')}
      </div>
    </div>`;
  }

  // Billing summary
  if (invoices.length) {
    const grandTotal = invoices.reduce((sum, inv) => sum + (inv.totalGross?.value || 0), 0);
    html += `<div class="overview-section">
      <div class="overview-title">Billing Summary</div>
      <div class="overview-body">
        <div class="overview-item">
          <div class="overview-dot" style="background:var(--teal)"></div>
          <div>
            <div style="font-size:18px;font-weight:600;letter-spacing:-.5px">₹${grandTotal.toFixed(2)}</div>
            <div style="font-size:11px;color:var(--color-text3)">${invoices.length} invoice${invoices.length > 1 ? 's' : ''}</div>
          </div>
        </div>
        ${invoices.flatMap(inv => inv.lineItem || []).map(lineItem => {
          const baseRate = lineItem.priceComponent?.find(pc => pc.type === 'base')?.amount?.value || 0;
          const description = lineItem.chargeItemReference?.display || lineItem.chargeItemCodeableConcept?.text || '';
          return baseRate > 0
            ? `<div class="overview-item"><div class="overview-dot" style="background:var(--color-text3)"></div><div style="font-size:12px;color:var(--color-text2)">${description} <span style="font-weight:500;color:var(--color-text)">₹${baseRate.toFixed(2)}</span></div></div>`
            : '';
        }).join('')}
      </div>
    </div>`;
  }

  // Clinical notes
  if (clinicalNoteObservations.length) {
    html += `<div class="overview-section">
      <div class="overview-title">Clinical Notes</div>
      <div class="overview-body">${clinicalNoteObservations.slice(0, 4).map(obs => {
        const noteName  = obs.code?.text || (obs.code?.coding || [])[0]?.display || '';
        const noteText  = obs.valueString || (obs.note || []).map(n => n.text).join(' ');
        return `<div class="overview-item">
          <div class="overview-dot" style="background:var(--purple)"></div>
          <div>
            <div style="font-size:11px;color:var(--color-text3)">${noteName}</div>
            <div style="font-size:12px">${noteText}</div>
          </div>
        </div>`;
      }).join('')}
      </div>
    </div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

// ─── Document (Composition narrative) ─────────────────────────────────────

function renderDocumentTab(container) {
  const composition = (resourceMap['Composition'] || [])[0];
  if (!composition?.section?.length) {
    container.innerHTML = '<div class="empty-state">No document sections.</div>';
    return;
  }
  container.innerHTML = composition.section.map(section => `
    <div class="composition-section">
      <div class="composition-section-title">${section.title || 'Section'}</div>
      ${section.text?.div ? `<div class="composition-section-text">${sanitizeNarrativeDiv(section.text.div)}</div>` : ''}
      ${section.section ? section.section.map(subSection => `
        <div style="margin-left:16px;margin-top:10px">
          <div style="font-size:13px;font-weight:500;margin-bottom:6px;color:var(--color-text2)">${subSection.title || ''}</div>
          ${subSection.text?.div ? `<div class="composition-section-text">${sanitizeNarrativeDiv(subSection.text.div)}</div>` : ''}
        </div>`).join('') : ''}
    </div>`).join('');
}

// ─── Conditions / Diagnoses ────────────────────────────────────────────────

function renderConditionsTab(container) {
  const allConditions = resourceMap['Condition'] || [];
  if (!allConditions.length) { container.innerHTML = '<div class="empty-state">No conditions.</div>'; return; }

  const activeConditions    = allConditions.filter(c => (c.clinicalStatus?.coding || [])[0]?.code === 'active');
  const historicalConditions = allConditions.filter(c => (c.clinicalStatus?.coding || [])[0]?.code !== 'active');

  let html = '';
  if (activeConditions.length)    html += buildConditionGroup('Active / Ongoing',       activeConditions);
  if (historicalConditions.length) html += buildConditionGroup('Resolved / Historical', historicalConditions);
  container.innerHTML = html;
}

function buildConditionGroup(groupTitle, conditions) {
  return `
    <div class="section-label" style="margin-bottom:8px">${groupTitle}</div>
    <div class="card">
      ${conditions.map(cond => {
        const status       = (cond.clinicalStatus?.coding || [])[0]?.code || 'unknown';
        const codings      = cond.code?.coding || [];
        const codeString   = codings.map(cd => cd.code).filter(Boolean).join(' · ');
        const codingSystem = codings[0]?.system || '';
        const systemLabel  = codingSystem.includes('icd') ? 'ICD-10' : codingSystem.includes('snomed') ? 'SNOMED' : '';
        const onsetDate    = cond.onsetDateTime?.slice(0, 10) || cond.onsetPeriod?.start?.slice(0, 10) || '';
        const noteText     = (cond.note || []).map(n => n.text).join('; ');
        const verifStatus  = (cond.verificationStatus?.coding || [])[0]?.code || '';
        const categoryText = (cond.category || []).map(cat => cat.text || (cat.coding || [])[0]?.display).filter(Boolean).join(', ');
        const { iconClass, tagClass } = getConditionStatusStyle(status);

        return `<div class="card-row">
          <div class="row-icon ${iconClass}">${status === 'active' ? 'Dx' : 'Hx'}</div>
          <div class="row-body">
            <div class="row-title">${getConditionLabel(cond)}</div>
            ${categoryText ? `<div class="row-detail">${categoryText}</div>` : ''}
            ${noteText     ? `<div class="row-detail" style="font-style:italic">${noteText}</div>` : ''}
            ${codeString   ? `<div class="row-code">${systemLabel ? systemLabel + ': ' : ''}${codeString}</div>` : ''}
          </div>
          <div class="row-aside">
            <span class="tag ${tagClass}">${capitalizeFirst(status)}</span>
            ${verifStatus && verifStatus !== 'confirmed' ? `<br><span class="tag tag-amber" style="margin-top:3px">${capitalizeFirst(verifStatus)}</span>` : ''}
            <div class="row-date">${onsetDate ? 'Since ' + onsetDate : ''}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ─── Medications ───────────────────────────────────────────────────────────

/**
 * Builds a human-readable frequency string from a FHIR Timing element.
 * e.g. "Twice per day · Morning, Evening"
 */
function buildTimingText(timing) {
  if (!timing) return '';
  if (timing.code?.text) return timing.code.text;
  const r = timing.repeat;
  if (!r) return '';
  const parts = [];
  if (r.frequency && r.period && r.periodUnit) {
    const freq = r.frequency === 1 ? 'Once' : r.frequency === 2 ? 'Twice' : `${r.frequency}×`;
    const unitMap = { s: 'second', min: 'minute', h: 'hour', d: 'day', wk: 'week', mo: 'month', a: 'year' };
    const unit = unitMap[r.periodUnit] || r.periodUnit;
    parts.push(r.period === 1 ? `${freq} per ${unit}` : `${freq} every ${r.period} ${unit}s`);
  } else if (r.frequency) {
    parts.push(`${r.frequency}×`);
  }
  if (r.when?.length) {
    const whenMap = { MORN: 'Morning', AFT: 'Afternoon', EVE: 'Evening', NIGHT: 'Night',
                      AC: 'Before meals', PC: 'After meals', HS: 'At bedtime', C: 'With meals' };
    parts.push(r.when.map(w => whenMap[w] || w).join(', '));
  }
  return parts.join(' · ');
}

function renderMedicationsTab(container) {
  const medicationRequests   = resourceMap['MedicationRequest']  || [];
  const medicationStatements = resourceMap['MedicationStatement'] || [];
  const allMedications = [
    ...medicationRequests.map(r  => ({ ...r, _source: 'request'   })),
    ...medicationStatements.map(s => ({ ...s, _source: 'statement' })),
  ];
  if (!allMedications.length) { container.innerHTML = '<div class="empty-state">No medications.</div>'; return; }

  container.innerHTML = allMedications.map(med => {
    const medicationName = getMedicationName(med);
    const status         = med.status || 'unknown';
    const prescribedDate = med.authoredOn?.slice(0, 10) || '';
    const noteLines      = (med.note || []).map(n => n.text).filter(Boolean);
    const { tagClass }   = getMedicationStatusStyle(status);

    // Dispense quantity (e.g. "10 tablet")
    const dispQty     = med.dispenseRequest?.quantity;
    const dispQtyText = dispQty ? `${dispQty.value ?? ''} ${dispQty.unit || ''}`.trim() : '';

    // Duration from dispenseRequest validity period
    const vp           = med.dispenseRequest?.validityPeriod;
    const durationText = vp
      ? `${vp.start?.slice(0, 10) || ''} → ${vp.end?.slice(0, 10) || ''}`.replace(/^ → $/, '').trim()
      : '';

    // Collect rows from ALL dosage instructions
    const dosageRows = (med.dosageInstruction || []).flatMap(d => {
      const rows = [];

      if (d.text) rows.push({ label: 'Instructions', value: d.text });

      // additionalInstruction – schedule codes like "1-0-1"
      const schedule = (d.additionalInstruction || [])
        .map(ai => ai.text || (ai.coding || [])[0]?.display)
        .filter(Boolean).join(', ');
      if (schedule) rows.push({ label: 'Schedule', value: schedule });

      // Dose
      const doseQty = d.doseAndRate?.[0]?.doseQuantity;
      if (doseQty?.value != null) rows.push({ label: 'Dose', value: `${doseQty.value} ${doseQty.unit || ''}`.trim() });

      // Route
      const route = d.route?.text || (d.route?.coding || [])[0]?.display || '';
      if (route) rows.push({ label: 'Route', value: route });

      // Frequency / timing
      const timingText = buildTimingText(d.timing);
      if (timingText) rows.push({ label: 'Frequency', value: timingText });

      // Bounds duration within dosage
      const bounds = d.timing?.repeat?.boundsDuration;
      if (bounds?.value != null) rows.push({ label: 'For', value: `${bounds.value} ${bounds.unit || ''}`.trim() });

      return rows;
    });

    return `<div class="rx-card">
      <div class="rx-header">
        <div class="rx-symbol">℞</div>
        <div class="rx-drug">
          ${medicationName}
          ${dispQtyText ? `<span style="font-size:12px;font-weight:400;color:var(--color-text2);margin-left:8px">${dispQtyText}</span>` : ''}
        </div>
        <span class="tag ${tagClass}">${capitalizeFirst(status)}</span>
      </div>
      <div class="rx-body">
        ${dosageRows.map(r => `<div><div class="rx-label">${r.label}</div><div class="rx-value">${r.value}</div></div>`).join('')}
        ${durationText   ? `<div><div class="rx-label">Duration</div><div class="rx-value">${durationText}</div></div>`   : ''}
        ${prescribedDate ? `<div><div class="rx-label">Prescribed</div><div class="rx-value">${prescribedDate}</div></div>` : ''}
      </div>
      ${noteLines.length ? `<div class="rx-note">${noteLines.map(l => `• ${l}`).join('<br>')}</div>` : ''}
    </div>`;
  }).join('');
}

// ─── Observations ──────────────────────────────────────────────────────────

function renderObservationsTab(container) {
  const allObservations = resourceMap['Observation'] || [];
  if (!allObservations.length) { container.innerHTML = '<div class="empty-state">No observations.</div>'; return; }

  const vitalObservations = allObservations.filter(isVitalObservation);
  const labObservations   = allObservations.filter(obs => isLabObservation(obs) && !isVitalObservation(obs));
  const noteObservations  = allObservations.filter(obs => (obs.valueString || obs.note?.length) && !isVitalObservation(obs) && !isLabObservation(obs));
  const otherObservations = allObservations.filter(obs => !isVitalObservation(obs) && !isLabObservation(obs) && !noteObservations.includes(obs));

  let html = '';

  // Vital signs grid
  if (vitalObservations.length) {
    html += `<div class="section-label" style="margin-bottom:10px">Vital Signs</div>
      <div class="vitals-grid" style="margin-bottom:16px">
        ${vitalObservations.map(obs => {
          const vitalName = obs.code?.text || (obs.code?.coding || [])[0]?.display || 'Unknown';
          const unit      = obs.valueQuantity?.unit || '';
          let value = obs.component
            ? obs.component.map(c => c.valueQuantity?.value?.toFixed(0)).filter(Boolean).join('/')
            : obs.valueQuantity?.value != null ? obs.valueQuantity.value : getObservationValue(obs);

          const numericValue = parseFloat(value);
          const interpCode   = (obs.interpretation || [])[0]?.coding?.[0]?.code || 'N';
          const refRange     = VITAL_REFERENCE_RANGES[vitalName.toLowerCase()];
          const isHigh       = ['H', 'HH'].includes(interpCode) || (refRange?.high && numericValue > refRange.high);
          const isLow        = ['L', 'LL'].includes(interpCode) || (refRange?.low  && numericValue < refRange.low);

          return `<div class="vital-card">
            <div class="vital-label">${vitalName}</div>
            <div class="vital-value ${isHigh ? 'vital-high' : isLow ? 'vital-low' : ''}">${value}</div>
            <div class="vital-unit">${unit}</div>
            ${isHigh ? `<div class="vital-flag"><span class="tag tag-red">↑ High</span></div>`   : ''}
            ${isLow  ? `<div class="vital-flag"><span class="tag tag-amber">↓ Low</span></div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  // Lab values table
  if (labObservations.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Lab Values</div>
      <div class="card" style="margin-bottom:16px">
        <table class="lab-table">
          <thead><tr><th>Test</th><th>Result</th><th>Reference Range</th><th>Flag</th><th>Date</th></tr></thead>
          <tbody>${labObservations.map(obs => {
            const testName    = obs.code?.text || (obs.code?.coding || [])[0]?.display || '—';
            const resultValue = getObservationValue(obs);
            const unit        = obs.valueQuantity?.unit || '';
            const refRange    = getObservationReferenceRange(obs);
            const recordDate  = (obs.effectiveDateTime || obs.issued || '').slice(0, 10);
            const interpCode  = (obs.interpretation || [])[0]?.coding?.[0]?.code || 'N';
            const isAbnormal  = ['H', 'L', 'HH', 'LL', 'A', 'AA'].includes(interpCode);
            const isHigh      = interpCode.startsWith('H');

            return `<tr>
              <td>${testName}</td>
              <td class="${isAbnormal ? 'lab-value-abnormal' : 'lab-value-normal'}">${resultValue} <span style="font-size:11px;font-weight:400;color:var(--color-text2)">${unit}</span></td>
              <td style="color:var(--color-text2)">${refRange}</td>
              <td>${isAbnormal ? `<span class="tag ${isHigh ? 'tag-red' : 'tag-amber'}">${isHigh ? '↑ High' : '↓ Low'}</span>` : '<span class="tag tag-green">Normal</span>'}</td>
              <td style="color:var(--color-text3)">${recordDate}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>`;
  }

  // Clinical notes
  if (noteObservations.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Clinical Notes</div>
      <div class="card" style="margin-bottom:16px">
        ${noteObservations.map(obs => {
          const noteName   = obs.code?.text || (obs.code?.coding || [])[0]?.display || 'Note';
          const noteText   = obs.valueString || (obs.note || []).map(n => n.text).join(' ');
          const noteDate   = (obs.effectiveDateTime || '').slice(0, 10);
          const components = obs.component || [];
          return `<div class="card-row">
            <div class="row-icon icon-purple">N</div>
            <div class="row-body">
              <div class="row-title">${noteName}</div>
              ${noteText ? `<div class="row-detail">${noteText}</div>` : ''}
              ${components.map(comp => {
                const compName  = comp.code?.text || (comp.code?.coding || [])[0]?.display || '';
                const compValue = getComponentValue(comp);
                return `<div class="row-detail">${compName ? `<span style="color:var(--color-text2)">${compName}:</span> ` : ''}${compValue}</div>`;
              }).join('')}
            </div>
            <div class="row-aside row-date">${noteDate}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // Other observations
  if (otherObservations.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Other Observations</div>
      <div class="card">
        ${otherObservations.map(obs => {
          const obsName    = obs.code?.text || (obs.code?.coding || [])[0]?.display || '—';
          const obsValue   = getObservationValue(obs);
          const obsUnit    = obs.valueQuantity?.unit || '';
          const obsDate    = (obs.effectiveDateTime || '').slice(0, 10);
          const components = obs.component || [];
          return `<div class="card-row">
            <div class="row-icon icon-gray">O</div>
            <div class="row-body">
              <div class="row-title">${obsName}</div>
              ${components.length
                ? components.map(comp => {
                    const compName  = comp.code?.text || (comp.code?.coding || [])[0]?.display || '';
                    const compValue = getComponentValue(comp);
                    return `<div class="row-detail">${compName ? `<span style="color:var(--color-text2)">${compName}:</span> ` : ''}${compValue}</div>`;
                  }).join('')
                : `<div class="row-detail">${obsValue}${obsUnit ? ' ' + obsUnit : ''}</div>`
              }
            </div>
            <div class="row-aside row-date">${obsDate}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  container.innerHTML = html || '<div class="empty-state">No observations.</div>';
}

// ─── Diagnostic Reports ────────────────────────────────────────────────────

function renderDiagnosticReportsTab(container) {
  const reports = resourceMap['DiagnosticReport'] || [];
  if (!reports.length) { container.innerHTML = '<div class="empty-state">No diagnostic reports.</div>'; return; }

  container.innerHTML = reports.map(report => {
    const reportName   = report.code?.text || (report.code?.coding || [])[0]?.display || 'Report';
    const status       = report.status || '—';
    const reportDate   = (report.effectiveDateTime || report.issued || '').slice(0, 10);
    const categoryText = (report.category || []).map(c => c.text || (c.coding || [])[0]?.display).filter(Boolean).join(', ');
    const conclusion   = report.conclusion || '';
    const resultRefs   = (report.result || []).map(ref => ref.display || ref.reference).filter(Boolean);
    const performerNames = (report.performer || []).map(p => p.display).filter(Boolean).join(', ');
    const statusTagClass = status === 'final' ? 'tag-green' : status === 'preliminary' ? 'tag-amber' : 'tag-gray';

    // Build view buttons for any presentedForm attachments (base64 or URL)
    const presentedFormBtns = (report.presentedForm || []).map(att => {
      const pfMime  = att.contentType || '';
      const pfTitle = att.title || reportName;
      const pfData  = att.data || '';
      const pfUrl   = att.url  || '';
      if (pfData) {
        const attId = registerAttachment(pfData, pfMime, pfTitle);
        const label = pfMime.includes('pdf') ? '📄 View PDF'
                    : pfMime.includes('image') ? '🖼 View Image'
                    : '👁 View';
        return `<button class="btn btn-secondary" style="margin-top:8px" onclick="openMediaViewerById('${attId}')">${label}</button>`;
      } else if (pfUrl) {
        const safeUrl   = pfUrl.replace(/'/g, "\\'");
        const safeTitle = pfTitle.replace(/'/g, "\\'");
        const safeMime  = pfMime.replace(/'/g, "\\'");
        return `<button class="btn btn-secondary" style="margin-top:8px" onclick="openMediaViewerByUrl('${safeUrl}','${safeMime}','${safeTitle}')">View</button>`;
      }
      return '';
    }).filter(Boolean).join(' ');

    return `<div class="card" style="margin-bottom:12px">
      <div class="card-header">
        ${categoryText || 'Diagnostic Report'}
        <span class="tag ${statusTagClass}">${capitalizeFirst(status)}</span>
      </div>
      <div class="card-row">
        <div class="row-icon icon-amber">🔬</div>
        <div class="row-body">
          <div class="row-title" style="font-size:15px">${reportName}</div>
          ${performerNames ? `<div class="row-detail">By ${performerNames}</div>` : ''}
          ${conclusion     ? `<div class="row-detail" style="margin-top:6px;line-height:1.7">${conclusion}</div>` : ''}
          ${resultRefs.length ? `<div class="row-detail" style="margin-top:6px">${resultRefs.join(', ')}</div>` : ''}
          ${presentedFormBtns ? `<div style="margin-top:8px">${presentedFormBtns}</div>` : ''}
        </div>
        <div class="row-aside row-date">${reportDate}</div>
      </div>
    </div>`;
  }).join('');
}

// ─── Allergies ─────────────────────────────────────────────────────────────

function renderAllergiesTab(container) {
  const allergies = resourceMap['AllergyIntolerance'] || [];
  if (!allergies.length) { container.innerHTML = '<div class="empty-state">No allergy records.</div>'; return; }

  container.innerHTML = `<div class="card">${allergies.map(allergy => {
    const allergenName  = allergy.code?.text || (allergy.code?.coding || [])[0]?.display || '—';
    const severity      = (allergy.reaction || [])[0]?.severity || allergy.criticality || 'unknown';
    const reactionsText = (allergy.reaction || [])
      .flatMap(rx => (rx.manifestation || []).map(m => m.text || (m.coding || [])[0]?.display))
      .filter(Boolean).join(', ');
    const allergyType    = allergy.type || '';
    const categoryText   = (allergy.category || []).join(', ');
    const noteText       = (allergy.note || []).map(n => n.text).join('; ');
    const recordedDate   = (allergy.recordedDate || '').slice(0, 10);
    const { iconClass, tagClass } = getAllergyStatusStyle(severity);

    return `<div class="card-row">
      <div class="row-icon ${iconClass}">⚠</div>
      <div class="row-body">
        <div class="row-title">${allergenName}</div>
        <div class="row-detail">
          ${[allergyType, categoryText].filter(Boolean).join(' · ')}
          ${reactionsText ? '<br>Reactions: ' + reactionsText : ''}
          ${noteText      ? '<br>' + noteText : ''}
        </div>
      </div>
      <div class="row-aside">
        <span class="tag ${tagClass}">${capitalizeFirst(severity)}</span>
        <div class="row-date">${recordedDate}</div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ─── Immunizations ─────────────────────────────────────────────────────────

function renderImmunizationsTab(container) {
  const immunizations = resourceMap['Immunization'] || [];
  if (!immunizations.length) { container.innerHTML = '<div class="empty-state">No immunization records.</div>'; return; }

  container.innerHTML = `<div class="card">${immunizations.map(imm => {
    const vaccineName    = imm.vaccineCode?.text || (imm.vaccineCode?.coding || [])[0]?.display || '—';
    const status         = imm.status || '—';
    const administeredDate = (imm.occurrenceDateTime || imm.occurrenceString || '').slice(0, 10);
    const lotNumber      = imm.lotNumber || '';
    const administrationSite  = imm.site?.text || '';
    const administrationRoute = imm.route?.text || '';
    const performerName  = (imm.performer || []).map(p => p.actor?.display).filter(Boolean).join(', ');
    const doseNumber     = imm.protocolApplied?.[0]?.doseNumberPositiveInt || imm.protocolApplied?.[0]?.doseNumberString || '';
    const seriesName     = imm.protocolApplied?.[0]?.series || '';
    const noteText       = (imm.note || []).map(n => n.text).join('; ');

    return `<div class="card-row">
      <div class="row-icon icon-coral">💉</div>
      <div class="row-body">
        <div class="row-title">${vaccineName}</div>
        <div class="row-detail">
          ${[doseNumber ? 'Dose ' + doseNumber : '', seriesName, lotNumber ? 'Lot: ' + lotNumber : '', administrationSite, administrationRoute, performerName].filter(Boolean).join(' · ')}
        </div>
        ${noteText ? `<div class="row-detail" style="font-style:italic">${noteText}</div>` : ''}
      </div>
      <div class="row-aside">
        <span class="tag ${status === 'completed' ? 'tag-green' : 'tag-gray'}">${capitalizeFirst(status)}</span>
        <div class="row-date">${administeredDate}</div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ─── Procedures ────────────────────────────────────────────────────────────

function renderProceduresTab(container) {
  const procedures = resourceMap['Procedure'] || [];
  if (!procedures.length) { container.innerHTML = '<div class="empty-state">No procedures.</div>'; return; }

  container.innerHTML = `<div class="card">${procedures.map(procedure => {
    const procedureName    = procedure.code?.text || (procedure.code?.coding || [])[0]?.display || '—';
    const status           = procedure.status || '—';
    const performedDate    = (procedure.performedDateTime || procedure.performedPeriod?.start || '').slice(0, 10);
    const performerName    = (procedure.performer || []).map(p => p.actor?.display).filter(Boolean).join(', ');
    const noteText         = (procedure.note || []).map(n => n.text).join('; ');
    const bodySiteText     = (procedure.bodySite || []).map(b => b.text || (b.coding || [])[0]?.display).filter(Boolean).join(', ');

    return `<div class="card-row">
      <div class="row-icon icon-teal">⚕</div>
      <div class="row-body">
        <div class="row-title">${procedureName}</div>
        <div class="row-detail">${[performerName, bodySiteText, noteText].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="row-aside">
        <span class="tag tag-gray">${capitalizeFirst(status)}</span>
        <div class="row-date">${performedDate}</div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ─── Family History ────────────────────────────────────────────────────────

function renderFamilyHistoryTab(container) {
  const familyHistories = resourceMap['FamilyMemberHistory'] || [];
  if (!familyHistories.length) { container.innerHTML = '<div class="empty-state">No family history.</div>'; return; }

  container.innerHTML = `<div class="card">${familyHistories.map(fmh => {
    const relationshipText = fmh.relationship?.text || (fmh.relationship?.coding || [])[0]?.display || '—';
    const status           = fmh.status || '—';
    const conditionNames   = (fmh.condition || []).map(c => c.code?.text || (c.code?.coding || [])[0]?.display).filter(Boolean);
    const isDeceased       = fmh.deceasedBoolean ? 'Deceased' : '';

    return `<div class="card-row">
      <div class="row-icon icon-gray">👪</div>
      <div class="row-body">
        <div class="row-title">${relationshipText}</div>
        ${conditionNames.length ? `<div class="row-detail">${conditionNames.join(', ')}</div>` : ''}
        ${isDeceased            ? `<div class="row-detail">${isDeceased}</div>`                : ''}
      </div>
      <div class="row-aside"><span class="tag tag-gray">${capitalizeFirst(status)}</span></div>
    </div>`;
  }).join('')}</div>`;
}

// ─── Service Requests / Orders ─────────────────────────────────────────────

function renderServiceRequestsTab(container) {
  const serviceRequests = resourceMap['ServiceRequest'] || [];
  if (!serviceRequests.length) { container.innerHTML = '<div class="empty-state">No service requests.</div>'; return; }

  container.innerHTML = `<div class="card">${serviceRequests.map(sr => {
    const requestName   = sr.code?.text || (sr.code?.coding || [])[0]?.display || '—';
    const status        = sr.status || '—';
    const intent        = sr.intent || '—';
    const requestedDate = (sr.authoredOn || '').slice(0, 10);
    const requesterName = sr.requester?.display || '';
    const noteText      = (sr.note || []).map(n => n.text).join('; ');
    const priority      = sr.priority || '';

    return `<div class="card-row">
      <div class="row-icon icon-blue">📋</div>
      <div class="row-body">
        <div class="row-title">${requestName}</div>
        <div class="row-detail">${[capitalizeFirst(intent), requesterName, noteText].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="row-aside">
        ${priority === 'urgent' ? '<span class="tag tag-red">Urgent</span><br>' : ''}
        <span class="tag tag-blue">${capitalizeFirst(status)}</span>
        <div class="row-date">${requestedDate}</div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ─── Billing ───────────────────────────────────────────────────────────────

function renderBillingTab(container) {
  const invoices    = resourceMap['Invoice']    || [];
  const chargeItems = resourceMap['ChargeItem'] || [];
  if (!invoices.length && !chargeItems.length) {
    container.innerHTML = '<div class="empty-state">No billing records.</div>';
    return;
  }

  let html = invoices.map(invoice => {
    const invoiceNumber = (invoice.identifier || [])[0]?.value || invoice.id || '—';
    const status        = invoice.status || '—';
    const invoiceDate   = (invoice.date || '').slice(0, 10);
    const invoiceType   = invoice.type?.coding?.[0]?.display || invoice.type?.text || 'Invoice';
    const grossTotal    = invoice.totalGross?.value ?? 0;
    const netTotal      = invoice.totalNet?.value   ?? 0;
    const currencySymbol = invoice.totalGross?.currency === 'INR' ? '₹' : '';
    const statusTagClass = ['issued', 'balanced'].includes(status) ? 'tag-green' : status === 'cancelled' ? 'tag-red' : 'tag-gray';

    const lineItemRows = (invoice.lineItem || []).map(lineItem => {
      const description  = lineItem.chargeItemReference?.display || lineItem.chargeItemCodeableConcept?.text || `Item ${lineItem.sequence}`;
      const mrpAmount    = lineItem.priceComponent?.find(pc => pc.type === 'informational')?.amount?.value ?? 0;
      const baseRate     = lineItem.priceComponent?.find(pc => pc.type === 'base')?.amount?.value          ?? 0;
      const discountAmt  = lineItem.priceComponent?.find(pc => pc.type === 'discount')?.amount?.value      ?? 0;
      const itemCurrency = lineItem.priceComponent?.[0]?.amount?.currency || 'INR';
      const itemSymbol   = itemCurrency === 'INR' ? '₹' : itemCurrency;

      return `<tr>
        <td style="color:var(--color-text3);font-family:var(--font-mono)">${lineItem.sequence || '—'}</td>
        <td>${description}</td>
        <td class="num">${itemSymbol}${mrpAmount.toFixed(2)}</td>
        <td class="num" style="color:var(--green-dark)">-${itemSymbol}${discountAmt.toFixed(2)}</td>
        <td class="num" style="font-weight:600">${itemSymbol}${baseRate.toFixed(2)}</td>
      </tr>`;
    }).join('');

    return `<div class="card" style="margin-bottom:16px">
      <div class="invoice-header">
        <div>
          <div style="font-size:15px;font-weight:600">${invoiceType}</div>
          <div style="font-size:12px;color:var(--color-text2);margin-top:2px">No. ${invoiceNumber}${invoiceDate ? ' &nbsp;·&nbsp; ' + invoiceDate : ''}</div>
          <div style="margin-top:8px"><span class="tag ${statusTagClass}">${capitalizeFirst(status)}</span></div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--color-text2);margin-bottom:4px">Total payable</div>
          <div class="invoice-total">${currencySymbol}${grossTotal.toFixed(2)}</div>
        </div>
      </div>
      ${lineItemRows
        ? `<table class="invoice-table">
            <thead><tr><th>#</th><th>Description</th><th>MRP</th><th>Discount</th><th>Rate</th></tr></thead>
            <tbody>${lineItemRows}</tbody>
           </table>
           <div class="invoice-footer">
             <div class="invoice-summary"><div class="invoice-summary-label">Net amount</div><div class="invoice-summary-value">${currencySymbol}${netTotal.toFixed(2)}</div></div>
             <div class="invoice-summary"><div class="invoice-summary-label">Gross total</div><div class="invoice-summary-value total">${currencySymbol}${grossTotal.toFixed(2)}</div></div>
           </div>`
        : '<div class="empty-state" style="padding:16px">No line items.</div>'}
    </div>`;
  }).join('');

  // Standalone charge items (when there are no invoices)
  if (chargeItems.length && !invoices.length) {
    html += `<div class="card">
      <div class="card-header">Charge Items</div>
      ${chargeItems.map(ci => {
        const itemName = ci.productReference?.display || ci.code?.text || (ci.code?.coding || [])[0]?.display || '—';
        const quantity = ci.quantity?.value || 1;
        const status   = ci.status || '—';
        return `<div class="card-row">
          <div class="row-icon icon-teal">₹</div>
          <div class="row-body">
            <div class="row-title">${itemName}</div>
            <div class="row-detail">Qty: ${quantity}</div>
          </div>
          <div class="row-aside"><span class="tag tag-teal">${capitalizeFirst(status)}</span></div>
        </div>`;
      }).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

// ─── Encounters ────────────────────────────────────────────────────────────

function renderEncountersTab(container) {
  const compositions = resourceMap['Composition'] || [];
  const encounters   = resourceMap['Encounter']   || [];
  let html = '';

  if (compositions.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Compositions</div>
      <div class="card">
        ${compositions.map(comp => {
          const profileUrl   = (comp.meta?.profile || [])[0] || '';
          const profileShort = profileUrl.split('/').pop() || 'Composition';
          return `<div class="card-row">
            <div class="row-icon icon-blue">D</div>
            <div class="row-body">
              <div class="row-title">${comp.title || comp.type?.text || 'Composition'}</div>
              <div class="row-detail">${comp.custodian?.display || '—'}</div>
              <div class="row-code">${profileShort}</div>
            </div>
            <div class="row-aside">
              <span class="tag tag-green">${capitalizeFirst(comp.status || '—')}</span>
              <div class="row-date">${(comp.date || '').slice(0, 10)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  if (encounters.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Encounters</div>
      <div class="card">
        ${encounters.map(enc => {
          const encounterType  = (enc.type || []).map(t => t.text || (t.coding || [])[0]?.display).filter(Boolean).join(', ') || capitalizeFirst(enc.class?.code || 'Encounter');
          const classCode      = enc.class?.code || '';
          const iconClass      = classCode === 'IMP' || classCode === 'inpatient' ? 'icon-red' : classCode === 'EMER' ? 'icon-amber' : 'icon-blue';
          const abbreviation   = classCode === 'IMP' ? 'IP' : classCode === 'EMER' ? 'ER' : 'OP';
          const reasonText     = (enc.reasonCode || []).map(r => r.text || (r.coding || [])[0]?.display).join(', ');
          const encounterId    = (enc.identifier || [])[0]?.value || '';
          const startDate      = (enc.period?.start || '').slice(0, 10);
          const statusTagClass = enc.status === 'in-progress' ? 'tag-red' : enc.status === 'finished' ? 'tag-gray' : 'tag-amber';

          return `<div class="card-row">
            <div class="row-icon ${iconClass}">${abbreviation}</div>
            <div class="row-body">
              <div class="row-title">${encounterType}</div>
              <div class="row-detail">${[reasonText, encounterId ? '#' + encounterId : ''].filter(Boolean).join(' · ')}</div>
            </div>
            <div class="row-aside">
              <span class="tag ${statusTagClass}">${capitalizeFirst(enc.status || '—')}</span>
              <div class="row-date">${startDate}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  container.innerHTML = html || '<div class="empty-state">No encounters.</div>';
}

// ─── Document References ───────────────────────────────────────────────────

function renderDocumentRefsTab(container) {
  const docRefs = resourceMap['DocumentReference'] || [];
  if (!docRefs.length) { container.innerHTML = '<div class="empty-state">No document references.</div>'; return; }

  container.innerHTML = `<div class="card">${docRefs.map(docRef => {
    const docName = docRef.description || (docRef.type?.coding || [])[0]?.display || docRef.type?.text || 'Document';
    const status  = docRef.status || '—';
    const docDate = (docRef.date || docRef.indexed || '').slice(0, 10);

    // A DocumentReference can have multiple content items (e.g. different formats)
    const contents = docRef.content || [];
    if (!contents.length) {
      return `<div class="doc-ref-row">
        <div class="doc-ref-icon">📎</div>
        <div>
          <div class="doc-ref-name">${docName}</div>
          <div class="doc-ref-meta">${[status, docDate].filter(Boolean).join(' · ')}</div>
        </div>
      </div>`;
    }

    return contents.map(content => {
      const att       = content.attachment || {};
      const mimeType  = att.contentType || '';
      const docUrl    = att.url || '';
      const docData   = att.data || '';   // base64-encoded binary
      const docTitle  = att.title || '';
      const displayTitle = docTitle || docName;
      const docIcon   = mimeType.includes('pdf')   ? '📄'
                      : mimeType.includes('image')  ? '🖼️'
                      : mimeType.includes('dicom')  ? '🏥'
                      : '📎';

      // Build the action button
      let actionBtn = '';
      if (docData) {
        // base64 inline data → use the media viewer
        const attId = registerAttachment(docData, mimeType, displayTitle);
        actionBtn = `<button class="btn btn-secondary doc-ref-view-btn" onclick="openMediaViewerById('${attId}')">
          ${mimeType.includes('pdf') ? '📄 View PDF' : mimeType.includes('image') ? '🖼 View Image' : '👁 View'}
        </button>`;
      } else if (docUrl) {
        // External URL — open in modal, not a new tab
        const safeUrl   = docUrl.replace(/'/g, "\\'");
        const safeTitle = displayTitle.replace(/'/g, "\\'");
        const safeMime  = mimeType.replace(/'/g, "\\'");
        actionBtn = `<button class="btn btn-secondary doc-ref-view-btn" onclick="openMediaViewerByUrl('${safeUrl}','${safeMime}','${safeTitle}')">View</button>`;
      }

      return `<div class="doc-ref-row">
        <div class="doc-ref-icon">${docIcon}</div>
        <div style="flex:1;min-width:0">
          <div class="doc-ref-name">${displayTitle}</div>
          <div class="doc-ref-meta">${[mimeType || 'unknown type', status, docDate].filter(Boolean).join(' · ')}</div>
        </div>
        ${actionBtn}
      </div>`;
    }).join('');
  }).join('')}</div>`;
}

// ─── Care Plan ─────────────────────────────────────────────────────────────

function renderCarePlanTab(container) {
  const carePlans = resourceMap['CarePlan'] || [];
  const goals     = resourceMap['Goal']     || [];
  let html = '';

  if (carePlans.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Care Plans</div>
      <div class="card">
        ${carePlans.map(plan => {
          const planTitle    = plan.title || plan.description || 'Care Plan';
          const status       = plan.status || '—';
          const activityNames = (plan.activity || [])
            .map(a => a.detail?.code?.text || (a.detail?.code?.coding || [])[0]?.display || a.reference?.display)
            .filter(Boolean);
          return `<div class="card-row">
            <div class="row-icon icon-purple">📋</div>
            <div class="row-body">
              <div class="row-title">${planTitle}</div>
              ${activityNames.length ? `<div class="row-detail">${activityNames.join(', ')}</div>` : ''}
            </div>
            <div class="row-aside"><span class="tag tag-purple">${capitalizeFirst(status)}</span></div>
          </div>`;
        }).join('')}
      </div>`;
  }

  if (goals.length) {
    html += `<div class="section-label" style="margin-bottom:8px">Goals</div>
      <div class="card">
        ${goals.map(goal => {
          const goalDescription = goal.description?.text || (goal.description?.coding || [])[0]?.display || '—';
          const lifecycleStatus = goal.lifecycleStatus || '—';
          return `<div class="card-row">
            <div class="row-icon icon-green">🎯</div>
            <div class="row-body"><div class="row-title">${goalDescription}</div></div>
            <div class="row-aside"><span class="tag tag-green">${capitalizeFirst(lifecycleStatus)}</span></div>
          </div>`;
        }).join('')}
      </div>`;
  }

  container.innerHTML = html || '<div class="empty-state">No care plan data.</div>';
}

// ─── Coverage / Insurance ──────────────────────────────────────────────────

function renderCoverageTab(container) {
  const coverages = resourceMap['Coverage'] || [];
  if (!coverages.length) { container.innerHTML = '<div class="empty-state">No coverage information.</div>'; return; }

  container.innerHTML = `<div class="card">${coverages.map(cov => {
    const payorNames  = (cov.payor || []).map(p => p.display || p.reference).filter(Boolean).join(', ');
    const status      = cov.status || '—';
    const coverType   = cov.type?.text || (cov.type?.coding || [])[0]?.display || '';
    const periodText  = cov.period ? `${(cov.period.start || '').slice(0, 10)} → ${(cov.period.end || '').slice(0, 10)}` : '';
    const memberId    = (cov.identifier || [])[0]?.value || cov.subscriberId || '';

    return `<div class="card-row">
      <div class="row-icon icon-teal">🛡</div>
      <div class="row-body">
        <div class="row-title">${coverType || 'Insurance'}</div>
        <div class="row-detail">${[payorNames, memberId, periodText].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="row-aside"><span class="tag tag-teal">${capitalizeFirst(status)}</span></div>
    </div>`;
  }).join('')}</div>`;
}

// ─── IPS: compact per-resource renderer ────────────────────────────────────

/**
 * Renders a single FHIR resource as a compact card-row.
 * Handles the resource types commonly found in IPS sections.
 */
function renderIPSEntry(resource) {
  if (!resource) return '';
  switch (resource.resourceType) {

    case 'Condition': {
      const status  = (resource.clinicalStatus?.coding || [])[0]?.code || 'unknown';
      const { iconClass, tagClass } = getConditionStatusStyle(status);
      const onset   = resource.onsetDateTime?.slice(0, 10) || resource.onsetPeriod?.start?.slice(0, 10) || '';
      const note    = (resource.note || []).map(n => n.text).join('; ');
      return `<div class="card-row">
        <div class="row-icon ${iconClass}" style="font-size:10px">${status === 'active' ? 'Dx' : 'Hx'}</div>
        <div class="row-body">
          <div class="row-title">${getConditionLabel(resource)}</div>
          ${note ? `<div class="row-detail" style="font-style:italic">${note}</div>` : ''}
        </div>
        <div class="row-aside">
          <span class="tag ${tagClass}">${capitalizeFirst(status)}</span>
          ${onset ? `<div class="row-date">${onset}</div>` : ''}
        </div>
      </div>`;
    }

    case 'AllergyIntolerance': {
      const allergen  = resource.code?.text || (resource.code?.coding || [])[0]?.display || '—';
      const severity  = (resource.reaction || [])[0]?.severity || resource.criticality || 'unknown';
      const { tagClass } = getAllergyStatusStyle(severity);
      const reactions = (resource.reaction || [])
        .flatMap(rx => (rx.manifestation || []).map(m => m.text || (m.coding || [])[0]?.display))
        .filter(Boolean).join(', ');
      return `<div class="card-row">
        <div class="row-icon icon-amber">⚠</div>
        <div class="row-body">
          <div class="row-title">${allergen}</div>
          ${reactions ? `<div class="row-detail">Reactions: ${reactions}</div>` : ''}
        </div>
        <div class="row-aside"><span class="tag ${tagClass}">${capitalizeFirst(severity)}</span></div>
      </div>`;
    }

    case 'MedicationRequest':
    case 'MedicationStatement': {
      const medName     = getMedicationName(resource);
      const status      = resource.status || 'unknown';
      const { tagClass } = getMedicationStatusStyle(status);
      const firstDosage = (resource.dosageInstruction || [])[0] || {};
      const schedule    = (firstDosage.additionalInstruction || [])
        .map(ai => ai.text || (ai.coding || [])[0]?.display).filter(Boolean).join(', ');
      const dosageText  = firstDosage.text || schedule || '';
      const dispQty     = resource.dispenseRequest?.quantity;
      const dispQtyText = dispQty ? `${dispQty.value ?? ''} ${dispQty.unit || ''}`.trim() : '';
      return `<div class="card-row">
        <div class="row-icon icon-green">℞</div>
        <div class="row-body">
          <div class="row-title">${medName}${dispQtyText ? `<span style="font-size:11px;font-weight:400;color:var(--color-text2);margin-left:6px">${dispQtyText}</span>` : ''}</div>
          ${dosageText ? `<div class="row-detail">${dosageText}</div>` : ''}
        </div>
        <div class="row-aside"><span class="tag ${tagClass}">${capitalizeFirst(status)}</span></div>
      </div>`;
    }

    case 'Immunization': {
      const vaccine = resource.vaccineCode?.text || (resource.vaccineCode?.coding || [])[0]?.display || '—';
      const status  = resource.status || '—';
      const date    = (resource.occurrenceDateTime || '').slice(0, 10);
      const dose    = resource.protocolApplied?.[0]?.doseNumberPositiveInt || '';
      return `<div class="card-row">
        <div class="row-icon icon-coral">💉</div>
        <div class="row-body">
          <div class="row-title">${vaccine}</div>
          ${dose ? `<div class="row-detail">Dose ${dose}</div>` : ''}
        </div>
        <div class="row-aside">
          <span class="tag ${status === 'completed' ? 'tag-green' : 'tag-gray'}">${capitalizeFirst(status)}</span>
          <div class="row-date">${date}</div>
        </div>
      </div>`;
    }

    case 'Observation': {
      const obsName  = resource.code?.text || (resource.code?.coding || [])[0]?.display || '—';
      const obsValue = getObservationValue(resource);
      const obsUnit  = resource.valueQuantity?.unit || '';
      const date     = (resource.effectiveDateTime || '').slice(0, 10);
      const components = resource.component || [];
      return `<div class="card-row">
        <div class="row-icon icon-blue" style="font-size:10px">Obs</div>
        <div class="row-body">
          <div class="row-title">${obsName}</div>
          ${components.length
            ? components.map(c => {
                const cName = c.code?.text || (c.code?.coding || [])[0]?.display || '';
                const cVal  = getComponentValue(c);
                return `<div class="row-detail">${cName ? `<span style="color:var(--color-text2)">${cName}:</span> ` : ''}${cVal}</div>`;
              }).join('')
            : `<div class="row-detail">${obsValue}${obsUnit ? ' ' + obsUnit : ''}</div>`
          }
        </div>
        <div class="row-aside row-date">${date}</div>
      </div>`;
    }

    case 'DiagnosticReport': {
      const reportName = resource.code?.text || (resource.code?.coding || [])[0]?.display || '—';
      const status     = resource.status || '—';
      const date       = (resource.effectiveDateTime || resource.issued || '').slice(0, 10);
      const conclusion = resource.conclusion || '';
      const tagClass   = status === 'final' ? 'tag-green' : 'tag-gray';
      return `<div class="card-row">
        <div class="row-icon icon-amber">🔬</div>
        <div class="row-body">
          <div class="row-title">${reportName}</div>
          ${conclusion ? `<div class="row-detail">${conclusion}</div>` : ''}
        </div>
        <div class="row-aside">
          <span class="tag ${tagClass}">${capitalizeFirst(status)}</span>
          <div class="row-date">${date}</div>
        </div>
      </div>`;
    }

    case 'Procedure': {
      const procName = resource.code?.text || (resource.code?.coding || [])[0]?.display || '—';
      const status   = resource.status || '—';
      const date     = (resource.performedDateTime || resource.performedPeriod?.start || '').slice(0, 10);
      const note     = (resource.note || []).map(n => n.text).join('; ');
      return `<div class="card-row">
        <div class="row-icon icon-teal">⚕</div>
        <div class="row-body">
          <div class="row-title">${procName}</div>
          ${note ? `<div class="row-detail">${note}</div>` : ''}
        </div>
        <div class="row-aside">
          <span class="tag tag-gray">${capitalizeFirst(status)}</span>
          <div class="row-date">${date}</div>
        </div>
      </div>`;
    }

    case 'Device': {
      const deviceName   = resource.type?.text || (resource.type?.coding || [])[0]?.display || resource.deviceName?.[0]?.name || '—';
      const status       = resource.status || '—';
      const manufacturer = resource.manufacturer || '';
      return `<div class="card-row">
        <div class="row-icon icon-blue">🩻</div>
        <div class="row-body">
          <div class="row-title">${deviceName}</div>
          ${manufacturer ? `<div class="row-detail">${manufacturer}</div>` : ''}
        </div>
        <div class="row-aside"><span class="tag tag-gray">${capitalizeFirst(status)}</span></div>
      </div>`;
    }

    case 'DeviceUseStatement': {
      const deviceRef = resource.device?.display || resource.device?.reference || '—';
      const bodysite  = resource.bodySite?.text || (resource.bodySite?.coding || [])[0]?.display || '';
      const date      = (resource.recordedOn || '').slice(0, 10);
      return `<div class="card-row">
        <div class="row-icon icon-blue">🩻</div>
        <div class="row-body">
          <div class="row-title">${deviceRef}</div>
          ${bodysite ? `<div class="row-detail">${bodysite}</div>` : ''}
        </div>
        <div class="row-aside row-date">${date}</div>
      </div>`;
    }

    case 'Flag': {
      const flagText = resource.code?.text || (resource.code?.coding || [])[0]?.display || '—';
      const status   = resource.status || '—';
      const date     = (resource.period?.start || '').slice(0, 10);
      const tagClass = status === 'active' ? 'tag-red' : 'tag-gray';
      return `<div class="card-row">
        <div class="row-icon icon-amber">🔔</div>
        <div class="row-body"><div class="row-title">${flagText}</div></div>
        <div class="row-aside">
          <span class="tag ${tagClass}">${capitalizeFirst(status)}</span>
          <div class="row-date">${date}</div>
        </div>
      </div>`;
    }

    case 'Consent': {
      const scope  = resource.scope?.text || (resource.scope?.coding || [])[0]?.display || 'Consent';
      const status = resource.status || '—';
      const date   = (resource.dateTime || '').slice(0, 10);
      const policyText = (resource.policy || []).map(p => p.uri).filter(Boolean).join(', ');
      return `<div class="card-row">
        <div class="row-icon icon-gray">📜</div>
        <div class="row-body">
          <div class="row-title">${scope}</div>
          ${policyText ? `<div class="row-detail">${policyText}</div>` : ''}
        </div>
        <div class="row-aside">
          <span class="tag tag-gray">${capitalizeFirst(status)}</span>
          <div class="row-date">${date}</div>
        </div>
      </div>`;
    }

    case 'ClinicalImpression': {
      const summary = resource.summary || resource.description || '—';
      const status  = resource.status || '—';
      const date    = (resource.effectiveDateTime || resource.date || '').slice(0, 10);
      const findings = (resource.finding || []).map(f => f.itemCodeableConcept?.text || (f.itemCodeableConcept?.coding || [])[0]?.display).filter(Boolean).join(', ');
      return `<div class="card-row">
        <div class="row-icon icon-purple">🏃</div>
        <div class="row-body">
          <div class="row-title">${summary}</div>
          ${findings ? `<div class="row-detail">${findings}</div>` : ''}
        </div>
        <div class="row-aside">
          <span class="tag tag-purple">${capitalizeFirst(status)}</span>
          <div class="row-date">${date}</div>
        </div>
      </div>`;
    }

    case 'CarePlan': {
      const title  = resource.title || resource.description || 'Care Plan';
      const status = resource.status || '—';
      return `<div class="card-row">
        <div class="row-icon icon-purple">📋</div>
        <div class="row-body"><div class="row-title">${title}</div></div>
        <div class="row-aside"><span class="tag tag-purple">${capitalizeFirst(status)}</span></div>
      </div>`;
    }

    default: {
      const display = resource.code?.text || resource.name || resource.title || resource.description || resource.resourceType;
      const status  = resource.status || '';
      return `<div class="card-row">
        <div class="row-icon icon-gray" style="font-size:9px;letter-spacing:0">${resource.resourceType.slice(0, 3).toUpperCase()}</div>
        <div class="row-body">
          <div class="row-title">${display}</div>
          <div class="row-code">${resource.resourceType}</div>
        </div>
        ${status ? `<div class="row-aside"><span class="tag tag-gray">${capitalizeFirst(status)}</span></div>` : ''}
      </div>`;
    }
  }
}

// ─── IPS Summary ───────────────────────────────────────────────────────────

/** Toggles an IPS section open/closed. */
function toggleIPSSection(id) {
  const body = document.getElementById(id);
  const icon = document.getElementById(id + '-icon');
  if (!body) return;
  const collapsed = body.style.display === 'none';
  body.style.display = collapsed ? '' : 'none';
  if (icon) icon.classList.toggle('collapsed', !collapsed);
}

function renderIPSSummaryTab(container) {
  const composition = (resourceMap['Composition'] || [])[0];
  if (!composition?.section?.length) {
    container.innerHTML = '<div class="empty-state">No IPS sections found in Composition.</div>';
    return;
  }

  function renderSection(section, depth) {
    const sectionCode   = (section.code?.coding || [])[0]?.code || '';
    const sectionConfig = IPS_SECTION_LOINC[sectionCode] || {};
    const sectionTitle  = section.title || sectionConfig.title || 'Section';
    const emptyReason   = section.emptyReason?.text || (section.emptyReason?.coding || [])[0]?.display || '';
    const narrative     = section.text?.div ? sanitizeNarrativeDiv(section.text.div) : '';
    const secId         = 'ips-sec-' + Math.random().toString(36).slice(2, 9);

    const entries = (section.entry || [])
      .map(ref => resolveReference(ref.reference))
      .filter(Boolean);

    const indent = depth > 0 ? 'margin-left:20px;' : '';
    const radius  = depth > 0 ? 'var(--radius-sm)' : 'var(--radius)';

    let bodyContent = '';
    if (emptyReason && !entries.length && !section.section?.length) {
      bodyContent = `<div style="padding:12px 16px;font-style:italic;color:var(--color-text3)">Not available: ${emptyReason}</div>`;
    } else if (entries.length) {
      bodyContent = entries.map(r => renderIPSEntry(r)).join('');
    } else if (narrative && !section.section?.length) {
      bodyContent = `<div style="padding:12px 16px;font-size:13px;line-height:1.7">${narrative}</div>`;
    } else if (!section.section?.length) {
      bodyContent = `<div style="padding:12px 16px;color:var(--color-text3);font-size:13px">No entries</div>`;
    }

    // Nested sub-sections go inside the collapsible body
    if (section.section?.length) {
      bodyContent += section.section.map(sub => renderSection(sub, depth + 1)).join('');
    }

    let html = `<div style="margin-bottom:14px;${indent}">
      <div class="ips-section-header" onclick="toggleIPSSection('${secId}')"
           style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--color-surface2);border-radius:${radius} ${radius} 0 0;border:0.5px solid var(--color-border)">
        <span style="font-size:15px">${sectionConfig.icon || '📋'}</span>
        <span style="font-size:13px;font-weight:600">${sectionTitle}</span>
        ${sectionCode ? `<span style="font-size:10px;font-family:var(--font-mono);color:var(--color-text3)">${sectionCode}</span>` : ''}
        ${entries.length ? `<span class="tag tag-gray" style="font-size:10px">${entries.length}</span>` : ''}
        <span class="ips-toggle-icon" id="${secId}-icon" style="margin-left:auto">▾</span>
      </div>
      <div id="${secId}" style="border:0.5px solid var(--color-border);border-top:none;border-radius:0 0 ${radius} ${radius};overflow:hidden;background:var(--color-surface)">
        ${bodyContent}
      </div>
    </div>`;

    return html;
  }

  container.innerHTML = composition.section.map(s => renderSection(s, 0)).join('');
}

// ─── IPS: Medical Devices ──────────────────────────────────────────────────

function renderDevicesTab(container) {
  const devices = [
    ...(resourceMap['Device'] || []),
    ...(resourceMap['DeviceUseStatement'] || []),
  ];
  if (!devices.length) { container.innerHTML = '<div class="empty-state">No medical devices.</div>'; return; }
  container.innerHTML = `<div class="card">${devices.map(d => renderIPSEntry(d)).join('')}</div>`;
}

// ─── IPS: Alerts / Flags ──────────────────────────────────────────────────

function renderAlertsTab(container) {
  const flags = resourceMap['Flag'] || [];
  if (!flags.length) { container.innerHTML = '<div class="empty-state">No alerts.</div>'; return; }
  container.innerHTML = `<div class="card">${flags.map(f => renderIPSEntry(f)).join('')}</div>`;
}

// ─── IPS: Advance Directives / Consent ────────────────────────────────────

function renderConsentTab(container) {
  const consents = resourceMap['Consent'] || [];
  if (!consents.length) { container.innerHTML = '<div class="empty-state">No advance directives / consent records.</div>'; return; }
  container.innerHTML = `<div class="card">${consents.map(c => renderIPSEntry(c)).join('')}</div>`;
}

// ─── IPS: Functional Status ────────────────────────────────────────────────

function renderFunctionalStatusTab(container) {
  const impressions = resourceMap['ClinicalImpression'] || [];
  if (!impressions.length) { container.innerHTML = '<div class="empty-state">No functional status assessments.</div>'; return; }
  container.innerHTML = `<div class="card">${impressions.map(i => renderIPSEntry(i)).join('')}</div>`;
}

// ─── All Resources ─────────────────────────────────────────────────────────

function renderAllResourcesTab(container) {
  const sortedResourceTypes = Object.keys(resourceMap).sort();

  container.innerHTML = sortedResourceTypes.map(type => {
    const resources = resourceMap[type];
    return `<div style="margin-bottom:16px">
      <div class="section-label" style="margin-bottom:6px">
        ${type} <span style="font-weight:400;letter-spacing:0;text-transform:none">(${resources.length})</span>
      </div>
      <div class="card">
        ${resources.map(resource => {
          const display = getResourceDisplayInfo(resource);
          return `<div class="card-row">
            <div class="row-icon icon-gray" style="font-size:9px;letter-spacing:0">${type.slice(0, 3).toUpperCase()}</div>
            <div class="row-body">
              <div class="row-title">${display.title}</div>
              <div class="row-detail">${display.sub}</div>
              ${resource.id ? `<div class="row-code">${resource.id}</div>` : ''}
            </div>
            ${display.tag ? `<div class="row-aside"><span class="tag ${display.tagClass}">${display.tag}</span></div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

// ─── Raw JSON ──────────────────────────────────────────────────────────────

function renderRawJsonTab(container) {
  container.innerHTML = `<div id="raw-json-pane"><pre>${escapeHtml(JSON.stringify(rawBundle, null, 2))}</pre></div>`;
}
