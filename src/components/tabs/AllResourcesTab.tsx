import { useFhir } from '../../context/FhirContext';
import { getResourceDisplayInfo } from '../../lib/helpers';

const RESOURCE_ORDER = [
  'Patient', 'Practitioner', 'PractitionerRole', 'Organization',
  'Composition', 'Encounter', 'Condition', 'MedicationRequest',
  'MedicationStatement', 'Observation', 'DiagnosticReport',
  'AllergyIntolerance', 'Immunization', 'Procedure',
  'FamilyMemberHistory', 'ServiceRequest', 'Invoice', 'ChargeItem',
  'Coverage', 'Device', 'DeviceUseStatement', 'Flag', 'Consent',
  'ClinicalImpression', 'CarePlan', 'Goal', 'DocumentReference',
  'Binary', 'Media',
];

export function AllResourcesTab() {
  const { resourceMap } = useFhir();
  const allTypes = Object.keys(resourceMap);
  const ordered  = [
    ...RESOURCE_ORDER.filter(t => allTypes.includes(t)),
    ...allTypes.filter(t => !RESOURCE_ORDER.includes(t)).sort(),
  ];

  if (!ordered.length) return <div className="empty-state">No resources found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ordered.map(type => {
        const resources = resourceMap[type] || [];
        if (!resources.length) return null;
        return (
          <div key={type}>
            <div className="section-label" style={{ marginBottom: 8 }}>
              {type} <span style={{ fontWeight: 400, color: 'var(--c-text3)', fontSize: 12 }}>({resources.length})</span>
            </div>
            <div className="card">
              {resources.map((res, i) => {
                const { title, sub, tag, tagClass } = getResourceDisplayInfo(res, resourceMap);
                return (
                  <div key={i} className="card-row">
                    <div className="row-body">
                      <div className="row-title">{title}</div>
                      {sub && <div className="row-detail">{sub}</div>}
                    </div>
                    {tag && (
                      <div className="row-aside">
                        <span className={`tag ${tagClass}`}>{tag}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
