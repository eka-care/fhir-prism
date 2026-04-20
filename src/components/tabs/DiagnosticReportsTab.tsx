import { useFhir } from "../../context/FhirContext";
import { cap } from "../../lib/helpers";
import type { MediaItem } from "../../lib/types";

interface Props {
  onOpenMedia: (item: MediaItem) => void;
}

export function DiagnosticReportsTab({ onOpenMedia }: Props) {
  const { resourceMap } = useFhir();
  const reports = resourceMap["DiagnosticReport"] || [];
  if (!reports.length)
    return <div className="empty-state">No diagnostic reports.</div>;

  return (
    <>
      {reports.map((report, i) => {
        const name =
          report.code?.text || report.code?.coding?.[0]?.display || "Report";
        const status = report.status || "—";
        const date = (report.effectiveDateTime || report.issued || "").slice(
          0,
          10,
        );
        const category = (report.category || [])
          .map(
            (c: { text?: string; coding?: { display?: string }[] }) =>
              c.text || c.coding?.[0]?.display,
          )
          .filter(Boolean)
          .join(", ");
        const conclusion = report.conclusion || "";
        const performer = (report.performer || [])
          .map((p: { display?: string }) => p.display)
          .filter(Boolean)
          .join(", ");
        const resultRefs = (report.result || [])
          .map(
            (r: { display?: string; reference?: string }) =>
              r.display || r.reference,
          )
          .filter(Boolean);
        const tagClass =
          status === "final"
            ? "tag-green"
            : status === "preliminary"
              ? "tag-amber"
              : "tag-gray";

        return (
          <div key={i} className="card" style={{ marginBottom: 12 }}>
            {category && (
              <div className="card-header">
                {category}
                <span className={`tag ${tagClass}`}>{cap(status)}</span>
              </div>
            )}
            <div className="card-row">
              <div className="row-icon icon-amber">🔬</div>
              <div className="row-body">
                <div className="row-title" style={{ fontSize: 15 }}>
                  {name}
                </div>
                {performer && <div className="row-detail">By {performer}</div>}
                {conclusion && (
                  <div
                    className="row-detail"
                    style={{ marginTop: 6, lineHeight: 1.7 }}
                  >
                    {conclusion}
                  </div>
                )}
                {resultRefs.length > 0 && (
                  <div className="row-detail" style={{ marginTop: 6 }}>
                    {resultRefs.join(", ")}
                  </div>
                )}
                {/* Attachment buttons */}
                {(report.presentedForm || []).map(
                  (
                    att: {
                      contentType?: string;
                      data?: string;
                      url?: string;
                      title?: string;
                    },
                    j: number,
                  ) => {
                    const mime = att.contentType || "";
                    const label = mime.includes("pdf")
                      ? "📄 View PDF"
                      : mime.includes("image")
                        ? "🖼 View Image"
                        : mime.includes("json") || mime.includes("fhir")
                          ? "{ } View JSON"
                          : mime.includes("text")
                            ? "📝 View Text"
                            : "👁 View";
                    if (att.data || att.url) {
                      return (
                        <button
                          key={j}
                          className="hover:prism-bg-bg-doc/10
          active:prism-scale-95
          prism-bg-transparent prism-h-36 prism-px-8
           prism-text-content-secondary
           prism-border-1
           prism-border-bg-seperator-dark
          prism-inline-flex prism-items-center prism-gap-6 prism-shrink-0 prism-whitespace-nowrap prism-rounded-7 prism-text-13 
          prism-font-500 prism-cursor-pointer prism-transition-all prism-duration-150"
                          style={{ marginTop: 8 }}
                          onClick={() =>
                            onOpenMedia({
                              data: att.data,
                              url: att.url,
                              contentType: mime,
                              title: att.title || name,
                            })
                          }
                        >
                          {label}
                        </button>
                      );
                    }
                    return null;
                  },
                )}
              </div>
              <div className="row-aside row-date">{date}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
