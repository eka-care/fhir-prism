import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';

export function BillingTab() {
  const { resourceMap } = useFhir();
  const invoices    = resourceMap['Invoice']    || [];
  const chargeItems = resourceMap['ChargeItem'] || [];

  if (!invoices.length && !chargeItems.length) return <div className="empty-state">No billing records.</div>;

  return (
    <>
      {invoices.map((inv, i) => {
        const num      = inv.identifier?.[0]?.value || inv.id || '—';
        const status   = inv.status || '—';
        const date     = (inv.date || '').slice(0, 10);
        const type     = inv.type?.coding?.[0]?.display || inv.type?.text || 'Invoice';
        const gross    = inv.totalGross?.value ?? 0;
        const net      = inv.totalNet?.value ?? 0;
        const sym      = inv.totalGross?.currency === 'INR' ? '₹' : '';
        const tagClass = ['issued', 'balanced'].includes(status) ? 'tag-green' : status === 'cancelled' ? 'tag-red' : 'tag-gray';

        return (
          <div key={i} className="card" style={{ marginBottom: 16 }}>
            <div className="invoice-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{type}</div>
                <div style={{ fontSize: 12, color: 'var(--c-text2)', marginTop: 2 }}>No. {num}{date && ` · ${date}`}</div>
                <div style={{ marginTop: 8 }}><span className={`tag ${tagClass}`}>{cap(status)}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--c-text2)', marginBottom: 4 }}>Total payable</div>
                <div className="invoice-total">{sym}{gross.toFixed(2)}</div>
              </div>
            </div>
            {inv.lineItem?.length > 0 ? (
              <>
                <table className="invoice-table">
                  <thead>
                    <tr><th>#</th><th>Description</th><th>MRP</th><th>Discount</th><th>Rate</th></tr>
                  </thead>
                  <tbody>
                    {(inv.lineItem || []).map((li: { sequence?: number; chargeItemReference?: { display?: string }; chargeItemCodeableConcept?: { text?: string }; priceComponent?: { type?: string; amount?: { value?: number; currency?: string } }[] }, j: number) => {
                      const desc    = li.chargeItemReference?.display || li.chargeItemCodeableConcept?.text || `Item ${li.sequence}`;
                      const mrp     = li.priceComponent?.find(pc => pc.type === 'informational')?.amount?.value ?? 0;
                      const base    = li.priceComponent?.find(pc => pc.type === 'base')?.amount?.value ?? 0;
                      const disc    = li.priceComponent?.find(pc => pc.type === 'discount')?.amount?.value ?? 0;
                      const cur     = li.priceComponent?.[0]?.amount?.currency || 'INR';
                      const s       = cur === 'INR' ? '₹' : cur;
                      return (
                        <tr key={j}>
                          <td style={{ color: 'var(--c-text3)', fontFamily: 'var(--font-mono)' }}>{li.sequence || '—'}</td>
                          <td>{desc}</td>
                          <td className="num">{s}{mrp.toFixed(2)}</td>
                          <td className="num" style={{ color: 'var(--c-green-dk)' }}>-{s}{disc.toFixed(2)}</td>
                          <td className="num" style={{ fontWeight: 600 }}>{s}{base.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="invoice-footer">
                  <div className="invoice-summary"><div className="invoice-summary-label">Net amount</div><div className="invoice-summary-value">{sym}{net.toFixed(2)}</div></div>
                  <div className="invoice-summary"><div className="invoice-summary-label">Gross total</div><div className="invoice-summary-value total">{sym}{gross.toFixed(2)}</div></div>
                </div>
              </>
            ) : <div className="empty-state" style={{ padding: 16 }}>No line items.</div>}
          </div>
        );
      })}

      {chargeItems.length > 0 && !invoices.length && (
        <div className="card">
          <div className="card-header">Charge Items</div>
          {chargeItems.map((ci, i) => {
            const name = ci.productReference?.display || ci.code?.text || ci.code?.coding?.[0]?.display || '—';
            const qty  = ci.quantity?.value || 1;
            return (
              <div key={i} className="card-row">
                <div className="row-icon icon-teal">₹</div>
                <div className="row-body">
                  <div className="row-title">{name}</div>
                  <div className="row-detail">Qty: {qty}</div>
                </div>
                <div className="row-aside"><span className="tag tag-teal">{cap(ci.status || '—')}</span></div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
