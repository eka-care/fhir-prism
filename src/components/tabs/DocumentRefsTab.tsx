import { useFhir } from "../../context/FhirContext";
import type { MediaItem } from "../../lib/types";

interface Props {
  onOpenMedia: (item: MediaItem) => void;
}

export function DocumentRefsTab({ onOpenMedia }: Props) {
  const { resourceMap } = useFhir();
  const list = resourceMap["DocumentReference"] || [];
  if (!list.length)
    return <div className="empty-state">No document references.</div>;

  return (
    <div className="card">
      {list.map((doc, i) => {
        const name =
          doc.description ||
          doc.type?.coding?.[0]?.display ||
          doc.type?.text ||
          "Document";
        const status = doc.status || "—";
        const date = (doc.date || doc.indexed || "").slice(0, 10);
        const contents = doc.content || [];

        if (!contents.length) {
          return (
            <div key={i} className="doc-ref-row">
              <div className="doc-ref-icon">📎</div>
              <div>
                <div className="doc-ref-name">{name}</div>
                <div className="doc-ref-meta">
                  {[status, date].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
          );
        }

        return contents.map(
          (
            content: {
              attachment?: {
                contentType?: string;
                data?: string;
                url?: string;
                title?: string;
              };
            },
            j: number,
          ) => {
            const att = content.attachment || {};
            const mime = att.contentType || "";
            const icon = mime.includes("pdf")
              ? "📄"
              : mime.includes("image")
                ? "🖼️"
                : mime.includes("json") || mime.includes("fhir")
                  ? "{ }"
                  : mime.includes("text")
                    ? "📝"
                    : mime.includes("dicom")
                      ? "🏥"
                      : "📎";
            const title = att.title || name;

            const canView = !!(att.data || att.url);

            return (
              <div key={`${i}-${j}`} className="doc-ref-row">
                <div className="doc-ref-icon">{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="doc-ref-name">{title}</div>
                  <div className="doc-ref-meta">
                    {[mime || "unknown type", status, date]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {canView && (
                  <button
                    className="hover:prism-bg-bg-doc/10
          active:prism-scale-95
          prism-bg-transparent prism-h-36 prism-px-8
           prism-text-content-secondary
           prism-border-1
           prism-border-bg-seperator-dark
          prism-inline-flex prism-items-center prism-gap-6 prism-shrink-0 prism-whitespace-nowrap prism-rounded-7 prism-text-13 
          prism-font-500 prism-cursor-pointer prism-transition-all prism-duration-150"
          
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                    onClick={() =>
                      onOpenMedia({
                        data: att.data,
                        url: att.url,
                        contentType: mime,
                        title,
                      })
                    }
                  >
                    {mime.includes("pdf")
                      ? "📄 View PDF"
                      : mime.includes("image")
                        ? "🖼 View"
                        : mime.includes("json") || mime.includes("fhir")
                          ? "{ } View"
                          : mime.includes("text")
                            ? "📝 View"
                            : "👁 View"}
                  </button>
                )}
              </div>
            );
          },
        );
      })}
    </div>
  );
}
