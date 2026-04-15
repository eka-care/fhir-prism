/**
 * renderers.js
 * Renders the top-level patient record view:
 *   document banner, patient header, info grid.
 * Tab content rendering is handled separately in tab-renderers.js.
 * Depends on: constants.js, state.js, helpers.js, tabs.js.
 */

/**
 * Shows the record panel and renders all top-level sections
 * for the given patient resource.
 *
 * @param {Object} patient - FHIR Patient resource
 */
function renderRecord(patient) {
  document.getElementById('upload-panel').style.display = 'none';
  document.getElementById('record').style.display = 'block';
  renderDocumentBanner();
  renderPatientHeader(patient);
  renderInfoGrid();
  buildTabs();
}

/**
 * Renders the document type banner (icon, name, date, organisation, pills).
 */
function renderDocumentBanner() {
  const composition = (resourceMap['Composition'] || [])[0];
  const documentDate = (composition?.date || rawBundle?.timestamp || '').slice(0, 10);
  const organisationName = composition?.custodian?.display || (resourceMap['Organization'] || [])[0]?.name || '';
  const allCompositions = resourceMap['Composition'] || [];
  const hasMultipleCompositions = allCompositions.length > 1;

  const bannerEl = document.getElementById('doc-banner');
  bannerEl.innerHTML = `
    <div class="doc-type-icon ${currentDocType.color}">${currentDocType.icon}</div>
    <div style="flex:1">
      <div class="doc-type-name">${currentDocType.name}</div>
      <div class="doc-type-meta">
        ${currentDocType.desc}
        ${documentDate     ? ' &nbsp;·&nbsp; ' + documentDate     : ''}
        ${organisationName ? ' &nbsp;·&nbsp; ' + organisationName : ''}
      </div>
      <div class="doc-type-pills">
        ${hasMultipleCompositions ? `<span class="tag tag-amber">${allCompositions.length} compositions</span>` : ''}
        ${rawBundle?.type ? `<span class="tag tag-gray">${rawBundle.type}</span>` : ''}
        ${(rawBundle?.meta?.security || []).map(s => `<span class="tag tag-red">${s.display || s.code}</span>`).join('')}
      </div>
    </div>
    <button class="btn btn-secondary" style="flex-shrink:0" onclick="goBackToUpload()">← Back</button>`;
}

/**
 * Renders the patient demographics header card.
 *
 * @param {Object} patient - FHIR Patient resource
 */
function renderPatientHeader(patient) {
  const headerEl = document.getElementById('patient-header');
  const displayName = getPatientName(patient);
  const initials    = getPatientInitials(patient);
  const dateOfBirth = patient.birthDate || '—';
  const gender      = patient.gender || '—';
  const mrn         = getPatientMRN(patient);
  const age         = dateOfBirth !== '—' ? calculateAge(dateOfBirth) : '—';
  const phoneNumber = (patient.telecom || []).find(t => t.system === 'phone')?.value || '';
  const abhaId      = (patient.identifier || []).find(
    ident => (ident.system || '').includes('ndhm') || (ident.system || '').includes('abha')
  )?.value || '';

  headerEl.innerHTML = `
    <div class="patient-avatar">${initials}</div>
    <div style="flex:1;min-width:160px">
      <div class="patient-name">${displayName}</div>
      <div class="patient-subtext">
        DOB: ${dateOfBirth} &nbsp;·&nbsp; Age ${age} &nbsp;·&nbsp; ${capitalizeFirst(gender)}
        &nbsp;·&nbsp; MRN: ${mrn}
        ${phoneNumber ? ' &nbsp;·&nbsp; ☎ ' + phoneNumber : ''}
      </div>
      <div class="patient-pills">
        ${abhaId ? `<span class="tag tag-blue">ABHA: ${abhaId}</span>` : ''}
        ${(patient.address || [])
          .map(addr => `<span class="tag tag-gray">${[addr.city, addr.state, addr.country].filter(Boolean).join(', ')}</span>`)
          .join('')}
      </div>
    </div>`;
}

/**
 * Renders the info grid below the patient header
 * (Consulting Doctor, Facility, Encounter, Document Date).
 */
function renderInfoGrid() {
  const infoGridEl = document.getElementById('info-grid');
  const infoCards = [];

  // Consulting doctor card
  const firstPractitioner = (resourceMap['Practitioner'] || [])[0];
  if (firstPractitioner) {
    const practitionerName = getPractitionerName(firstPractitioner);
    const qualifications = (firstPractitioner.qualification || [])
      .map(q => q.code?.text || (q.code?.coding || [])[0]?.display)
      .filter(Boolean)
      .join(', ');
    infoCards.push(`
      <div class="info-card">
        <div class="info-label">Consulting Doctor</div>
        <div class="info-value">${practitionerName}</div>
        ${qualifications ? `<div class="info-sub">${qualifications}</div>` : ''}
      </div>`);
  }

  // Facility / organisation card
  const firstOrg = (resourceMap['Organization'] || [])[0];
  if (firstOrg) {
    const orgPhone = (firstOrg.telecom || []).find(t => t.system === 'phone')?.value || '';
    infoCards.push(`
      <div class="info-card">
        <div class="info-label">Facility</div>
        <div class="info-value">${firstOrg.name || '—'}</div>
        ${orgPhone && orgPhone !== '-' ? `<div class="info-sub">☎ ${orgPhone}</div>` : ''}
      </div>`);
  }

  // Encounter card
  const firstEncounter = (resourceMap['Encounter'] || [])[0];
  if (firstEncounter) {
    const encounterClass  = firstEncounter.class?.display || capitalizeFirst(firstEncounter.class?.code || '');
    const encounterStatus = firstEncounter.status || '—';
    const encounterStart  = (firstEncounter.period?.start || '').slice(0, 10);
    const encounterId     = (firstEncounter.identifier || [])[0]?.value || '';
    infoCards.push(`
      <div class="info-card">
        <div class="info-label">Encounter</div>
        <div class="info-value">${encounterClass}</div>
        <div class="info-sub">
          ${capitalizeFirst(encounterStatus)}
          ${encounterStart  ? ' · ' + encounterStart : ''}
          ${encounterId     ? ' · #' + encounterId   : ''}
        </div>
      </div>`);
  }

  // Document date card
  const firstComposition = (resourceMap['Composition'] || [])[0];
  if (firstComposition) {
    const documentDate = (firstComposition.date || '').slice(0, 10);
    const authorName = firstComposition.author?.[0]?.display ||
      (resourceMap['Practitioner'] || []).map(p => getPractitionerName(p)).filter(Boolean)[0] || '';
    if (documentDate) {
      infoCards.push(`
        <div class="info-card">
          <div class="info-label">Document Date</div>
          <div class="info-value">${documentDate}</div>
          ${authorName ? `<div class="info-sub">By ${authorName}</div>` : ''}
        </div>`);
    }
  }

  infoGridEl.innerHTML = infoCards.join('');
  infoGridEl.style.display = infoCards.length ? 'grid' : 'none';
}
