/**
 * tabs.js
 * Builds the tab bar from the resource types present in the loaded bundle
 * and handles tab switching with lazy rendering.
 * Depends on: state.js, tab-renderers.js.
 */

/**
 * Builds the tab bar and tab content containers based on which
 * FHIR resource types are present in `resourceMap`.
 * The first tab is rendered immediately; all others are lazy-rendered on first open.
 */
function buildTabs() {
  const hasResourceType  = type => (resourceMap[type] || []).length > 0;
  const getResourceCount = type => (resourceMap[type] || []).length;

  const tabDefinitions = [];

  // Overview is always first
  tabDefinitions.push({ id: 'overview',    label: 'Overview',       renderFn: renderOverviewTab });

  // // Composition narrative sections
  // const firstComposition = (resourceMap['Composition'] || [])[0];
  // if (firstComposition?.section?.length) {
  //   tabDefinitions.push({ id: 'document',  label: 'Composition',       renderFn: renderDocumentTab });
  // }

  // Clinical tabs — shown only when the corresponding resources exist
  if (hasResourceType('Condition')) {
    tabDefinitions.push({ id: 'conditions',    label: 'Diagnoses',      count: getResourceCount('Condition'),        renderFn: renderConditionsTab });
  }
  if (hasResourceType('MedicationRequest') || hasResourceType('MedicationStatement')) {
    tabDefinitions.push({ id: 'medications',   label: 'Medications',    count: getResourceCount('MedicationRequest') + getResourceCount('MedicationStatement'), renderFn: renderMedicationsTab });
  }
  if (hasResourceType('Observation')) {
    tabDefinitions.push({ id: 'observations',  label: 'Observations',   count: getResourceCount('Observation'),       renderFn: renderObservationsTab });
  }
  if (hasResourceType('DiagnosticReport')) {
    tabDefinitions.push({ id: 'lab-reports',   label: 'Lab Reports',    count: getResourceCount('DiagnosticReport'),  renderFn: renderDiagnosticReportsTab });
  }
  if (hasResourceType('AllergyIntolerance')) {
    tabDefinitions.push({ id: 'allergies',     label: 'Allergies',      count: getResourceCount('AllergyIntolerance'),renderFn: renderAllergiesTab });
  }
  if (hasResourceType('Immunization')) {
    tabDefinitions.push({ id: 'immunizations', label: 'Immunizations',  count: getResourceCount('Immunization'),      renderFn: renderImmunizationsTab });
  }
  if (hasResourceType('Procedure')) {
    tabDefinitions.push({ id: 'procedures',    label: 'Procedures',     count: getResourceCount('Procedure'),         renderFn: renderProceduresTab });
  }
  if (hasResourceType('FamilyMemberHistory')) {
    tabDefinitions.push({ id: 'family-history','label': 'Family History',                                              renderFn: renderFamilyHistoryTab });
  }
  if (hasResourceType('ServiceRequest')) {
    tabDefinitions.push({ id: 'orders',        label: 'Orders',         count: getResourceCount('ServiceRequest'),    renderFn: renderServiceRequestsTab });
  }
  if (hasResourceType('Invoice') || hasResourceType('ChargeItem')) {
    tabDefinitions.push({ id: 'billing',       label: 'Billing',                                                      renderFn: renderBillingTab });
  }
  if (hasResourceType('Encounter')) {
    tabDefinitions.push({ id: 'encounters',    label: 'Encounters',     count: getResourceCount('Encounter'),         renderFn: renderEncountersTab });
  }
  if (hasResourceType('DocumentReference')) {
    tabDefinitions.push({ id: 'doc-refs',      label: 'Documents',      count: getResourceCount('DocumentReference'), renderFn: renderDocumentRefsTab });
  }
  if (hasResourceType('CarePlan') || hasResourceType('Goal')) {
    tabDefinitions.push({ id: 'care-plan',     label: 'Care Plan',                                                    renderFn: renderCarePlanTab });
  }
  if (hasResourceType('Coverage')) {
    tabDefinitions.push({ id: 'coverage',      label: 'Insurance',                                                    renderFn: renderCoverageTab });
  }

  // Always present: all resources raw view + raw JSON
  tabDefinitions.push({ id: 'all-resources', label: 'All Resources', renderFn: renderAllResourcesTab });
  tabDefinitions.push({ id: 'raw-json',      label: 'Raw FHIR',      renderFn: renderRawJsonTab });

  // Render tab bar buttons
  const tabBarEl = document.getElementById('tab-bar');
  tabBarEl.innerHTML = tabDefinitions.map((tab, index) => `
    <button
      class="tab-button${index === 0 ? ' active' : ''}"
      onclick="switchTab('${tab.id}', this)"
    >${tab.label}${tab.count ? `<span class="tab-count-badge">${tab.count}</span>` : ''}</button>
  `).join('');

  // Render tab content containers
  const tabContentEl = document.getElementById('tab-content');
  tabContentEl.innerHTML = tabDefinitions.map((tab, index) => `
    <div id="tab-pane-${tab.id}" class="tab-pane${index === 0 ? ' active' : ''}"></div>
  `).join('');

  // Store definitions in state and render the first tab immediately
  activeTabs = tabDefinitions.map(tab => ({ ...tab, _rendered: false }));
  const firstTabPane = document.getElementById(`tab-pane-${tabDefinitions[0].id}`);
  tabDefinitions[0].renderFn(firstTabPane);
  activeTabs[0]._rendered = true;
}

/**
 * Activates a tab by id and lazy-renders its content on first open.
 *
 * @param {string}      tabId  - The id of the tab to activate.
 * @param {HTMLElement} button - The clicked tab button element.
 */
function switchTab(tabId, button) {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn  => btn.classList.remove('active'));

  document.getElementById(`tab-pane-${tabId}`).classList.add('active');
  button.classList.add('active');

  const tabDef = activeTabs.find(t => t.id === tabId);
  if (tabDef && !tabDef._rendered) {
    tabDef.renderFn(document.getElementById(`tab-pane-${tabId}`));
    tabDef._rendered = true;
  }
}
