import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function DevicesTab() {
  const { resourceMap } = useFhir();
  const devices   = resourceMap['Device']             || [];
  const dusList   = resourceMap['DeviceUseStatement'] || [];

  if (!devices.length && !dusList.length) return <div className="empty-state">No device data.</div>;

  return (
    <>
      {devices.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>Devices</div>
          <div className="card">
            {devices.map((dev, i) => {
              const name   = dev.deviceName?.[0]?.name || dev.type?.coding?.[0]?.display || dev.type?.text || 'Device';
              const status = dev.status || '—';
              const mfr    = dev.manufacturer || '';
              const tagClass = status === 'active' ? 'tag-blue' : 'tag-gray';
              return (
                <div key={i} className="card-row">
                  <div className="row-icon icon-blue">🩻</div>
                  <div className="row-body">
                    <div className="row-title">{name}</div>
                    {mfr && <div className="row-detail">Manufacturer: {mfr}</div>}
                  </div>
                  <div className="row-aside">
                    <span className={`tag ${tagClass}`}>{cap(status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {dusList.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8, marginTop: devices.length ? 16 : 0 }}>Device Use Statements</div>
          <div className="card">
            {dusList.map((dus, i) => {
              const device   = dus.device?.display || 'Device';
              const bodySite = dus.bodySite?.coding?.[0]?.display || dus.bodySite?.text || '';
              const date     = (dus.recordedOn || '').slice(0, 10);
              return (
                <div key={i} className="card-row">
                  <div className="row-icon icon-teal">🩻</div>
                  <div className="row-body">
                    <div className="row-title">{device}</div>
                    {bodySite && <div className="row-detail">Site: {bodySite}</div>}
                  </div>
                  <div className="row-aside">
                    <div className="row-date">{date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
