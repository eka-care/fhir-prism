import { useFhir } from '../context/FhirContext';

export function DocumentBanner() {
  const { resourceMap, rawBundle, docType, goBack } = useFhir();
  const composition = (resourceMap['Composition'] || [])[0];
  const documentDate = (composition?.date || rawBundle?.timestamp || '').slice(0, 10);
  const orgName = composition?.custodian?.display || (resourceMap['Organization'] || [])[0]?.name || '';
  const allComps = resourceMap['Composition'] || [];

  return (
    <div
      className="prism-flex prism-items-center prism-gap-14 prism-flex-wrap prism-mb-14"
      style={{ background: 'var(--c-surface)', border: '0.5px solid var(--c-border)', borderRadius: 'var(--radius)', padding: '14px 20px' }}
    >
      {/* Icon */}
      <div
        className={`${docType.color} prism-flex prism-items-center prism-justify-center prism-shrink-0`}
        style={{ width: 42, height: 42, borderRadius: 10, fontSize: 20 }}
      >
        {docType.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>{docType.name}</div>
        <div style={{ fontSize: 12, color: 'var(--c-text2)', marginTop: 2 }}>
          {docType.desc}
          {documentDate && <> &nbsp;·&nbsp; {documentDate}</>}
          {orgName && <> &nbsp;·&nbsp; {orgName}</>}
        </div>
        <div className="prism-flex prism-gap-6 prism-flex-wrap prism-mt-6">
          {allComps.length > 1 && <span className="tag tag-amber">{allComps.length} compositions</span>}
          {rawBundle?.type && <span className="tag tag-gray">{rawBundle.type}</span>}
          {(rawBundle?.meta?.security || []).map((s, i) => (
            <span key={i} className="tag tag-red">{s.display || s.code}</span>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button className="btn btn-secondary prism-shrink-0" onClick={goBack}>← Back</button>
    </div>
  );
}
