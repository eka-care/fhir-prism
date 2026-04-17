import { useFhir } from '../context/FhirContext';
import { getPatientName, getPatientInitials, getPatientMRN, calculateAge, cap } from '../lib/helpers';

export function PatientHeader() {
  const { resourceMap } = useFhir();
  const patient = (resourceMap['Patient'] || [])[0];
  if (!patient) return null;

  const name     = getPatientName(patient);
  const initials = getPatientInitials(patient);
  const dob      = patient.birthDate || '—';
  const gender   = patient.gender || '—';
  const mrn      = getPatientMRN(patient);
  const age      = dob !== '—' ? calculateAge(dob) : '—';
  const phone    = (patient.telecom || []).find((t: { system?: string }) => t.system === 'phone')?.value || '';
  const abha     = (patient.identifier || []).find(
    (id: { system?: string }) => (id.system || '').includes('ndhm') || (id.system || '').includes('abha')
  )?.value || '';

  return (
    <div
      className="prism-flex prism-items-start prism-gap-16 prism-flex-wrap prism-mb-14"
      style={{ background: 'var(--c-surface)', border: '0.5px solid var(--c-border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}
    >
      {/* Avatar */}
      <div
        className="prism-flex prism-items-center prism-justify-center prism-shrink-0"
        style={{ width: 50, height: 50, borderRadius: '50%', fontSize: 18, fontWeight: 600, background: 'var(--c-blue-bg)', color: 'var(--c-blue-dk)' }}
      >
        {initials}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.3px' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--c-text2)', marginTop: 3 }}>
          DOB: {dob} &nbsp;·&nbsp; Age {age} &nbsp;·&nbsp; {cap(gender)}
          &nbsp;·&nbsp; MRN: {mrn}
          {phone && <> &nbsp;·&nbsp; ☎ {phone}</>}
        </div>
        <div className="prism-flex prism-flex-wrap prism-gap-5 prism-mt-8">
          {abha && <span className="tag tag-blue">ABHA: {abha}</span>}
          {(patient.address || []).map((addr: { city?: string; state?: string; country?: string }, i: number) => {
            const loc = [addr.city, addr.state, addr.country].filter(Boolean).join(', ');
            return loc ? <span key={i} className="tag tag-gray">{loc}</span> : null;
          })}
        </div>
      </div>
    </div>
  );
}
