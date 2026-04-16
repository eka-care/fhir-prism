import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function DirectivesTab() {
  const { resourceMap } = useFhir();
  const consents = resourceMap['Consent'] || [];
  if (!consents.length) return <div className="empty-state">No advance directives or consent records.</div>;

  return (
    <div className="card">
      {consents.map((consent, i) => {
        const scope    = consent.scope?.coding?.[0]?.display || consent.scope?.text || 'Consent';
        const status   = consent.status || '—';
        const date     = (consent.dateTime || '').slice(0, 10);
        const policy   = (consent.policy || []).map((p: { uri?: string }) => p.uri).filter(Boolean).join(', ');
        const tagClass = status === 'active' ? 'tag-green' : status === 'rejected' ? 'tag-red' : 'tag-gray';

        return (
          <div key={i} className="card-row">
            <div className="row-icon icon-gray">📜</div>
            <div className="row-body">
              <div className="row-title">{scope}</div>
              {policy && <div className="row-detail row-code">{policy}</div>}
            </div>
            <div className="row-aside">
              <span className={`tag ${tagClass}`}>{cap(status)}</span>
              {date && <div className="row-date">{date}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
