import { useEffect, useRef, useState, useCallback } from 'react';
import type { MediaItem } from '../lib/types';

// PDF.js loaded from CDN in index.html
declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (opts: unknown) => { promise: Promise<PdfDoc> };
    };
  }
}
interface PdfDoc  { numPages: number; getPage: (n: number) => Promise<PdfPage>; destroy: () => void; }
interface PdfPage { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: unknown) => { promise: Promise<void>; cancel: () => void }; }

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Decode base64 → UTF-8 string */
function b64ToString(base64: string): string {
  try {
    return decodeURIComponent(
      Array.from(atob(base64), c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    );
  } catch {
    return atob(base64);
  }
}

/** Decode base64 → Uint8Array (for PDF.js) */
function b64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(base64);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function mimeCategory(type: string): 'pdf' | 'image' | 'text' | 'json' | 'other' {
  const t = type.toLowerCase();
  if (t.includes('pdf'))                                          return 'pdf';
  if (t.startsWith('image/'))                                     return 'image';
  if (t === 'text/plain' || t.startsWith('text/'))               return 'text';
  if (t.includes('json') || t.includes('fhir'))                  return 'json';
  return 'other';
}

// ─── Sub-renderers ────────────────────────────────────────────────────────

/** Plain-text (text/plain, text/html, text/xml, etc.) */
function TextViewer({ data, url }: { data?: string; url?: string }) {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data) {
      setText(b64ToString(data));
      setLoading(false);
    } else if (url) {
      fetch(url)
        .then(r => r.text())
        .then(t => { setText(t); setLoading(false); })
        .catch(e => { setText(`Error fetching: ${e.message}`); setLoading(false); });
    }
  }, [data, url]);

  if (loading) return <Spinner />;
  return (
    <pre style={{
      padding: 20, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.65,
      color: 'var(--c-text)', background: 'var(--c-surface)',
      overflowY: 'auto', flex: 1,
    }}>
      {text}
    </pre>
  );
}

/** JSON / FHIR JSON */
function JsonViewer({ data, url }: { data?: string; url?: string }) {
  const [formatted, setFormatted] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function format(raw: string) {
      try   { setFormatted(JSON.stringify(JSON.parse(raw), null, 2)); }
      catch { setFormatted(raw); }
      setLoading(false);
    }
    if (data)      { format(b64ToString(data)); }
    else if (url)  {
      fetch(url)
        .then(r => r.text())
        .then(format)
        .catch(e => { setFormatted(`Error fetching: ${e.message}`); setLoading(false); });
    }
  }, [data, url]);

  if (loading) return <Spinner />;
  return (
    <pre style={{
      padding: 20, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
      color: 'var(--c-text)', background: 'var(--c-surface)',
      overflowY: 'auto', flex: 1,
    }}>
      {formatted}
    </pre>
  );
}

/** Images (jpg, jpeg, png, gif, webp, svg, etc.) */
function ImageViewer({ data, url, contentType }: { data?: string; url?: string; contentType: string }) {
  const src = data ? `data:${contentType};base64,${data}` : url!;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 16, overflowY: 'auto', flex: 1 }}>
      <img
        src={src}
        alt="Attachment"
        style={{ maxWidth: '100%', borderRadius: 6, boxShadow: '0 2px 16px rgba(0,0,0,.15)' }}
      />
    </div>
  );
}

/** PDF via PDF.js (base64) or iframe (URL) */
function PdfViewer({ data, url }: { data?: string; url?: string }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pdfDocRef  = useRef<PdfDoc | null>(null);
  const renderRef  = useRef<{ cancel: () => void } | null>(null);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const renderPage = useCallback(async (num: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    if (renderRef.current) { try { renderRef.current.cancel(); } catch (_) {} }
    const p  = await pdfDocRef.current.getPage(num);
    const canvas = canvasRef.current;
    const dpr    = window.devicePixelRatio || 1;
    const cw     = (canvas.parentElement?.clientWidth || 800) - 40;
    const base   = p.getViewport({ scale: 1 });
    const scale  = Math.min(cw / base.width, 2) * dpr;
    const vp     = p.getViewport({ scale });
    canvas.width  = vp.width;
    canvas.height = vp.height;
    canvas.style.width  = `${vp.width / dpr}px`;
    canvas.style.height = `${vp.height / dpr}px`;
    const task = p.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
    renderRef.current = task;
    await task.promise;
    renderRef.current = null;
  }, []);

  useEffect(() => {
    if (!data) return; // URL PDFs handled by iframe branch
    let cancelled = false;
    (async () => {
      try {
        if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const doc = await window.pdfjsLib.getDocument({ data: b64ToBytes(data) }).promise;
        if (cancelled) { doc.destroy(); return; }
        pdfDocRef.current = doc;
        setTotal(doc.numPages);
        setPage(1);
        setLoading(false);
        await renderPage(1);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (renderRef.current) { try { renderRef.current.cancel(); } catch (_) {} }
      if (pdfDocRef.current) { pdfDocRef.current.destroy(); pdfDocRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (total > 0) renderPage(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, total]);

  // URL-based PDF → browser's built-in PDF viewer via iframe
  if (!data && url) {
    return (
      <iframe
        src={url}
        style={{ flex: 1, border: 'none', width: '100%', minHeight: 480 }}
        title="PDF"
      />
    );
  }

  return (
    <>
      {/* Page controls */}
      {total > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
          borderBottom: '0.5px solid var(--c-border)', background: 'var(--c-surface2)',
          flexShrink: 0,
        }}>
          <button className="btn btn-secondary" style={{ height: 30, padding: '0 12px' }}
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--c-text2)' }}>Page {page} of {total}</span>
          <button className="btn btn-secondary" style={{ height: 30, padding: '0 12px' }}
            onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page >= total}>Next →</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 16, background: '#525659' }}>
        {loading && <Spinner />}
        {error   && (
          <div className="mv-placeholder">
            <div className="mv-placeholder-icon">⚠️</div>
            <div style={{ color: 'var(--c-text2)' }}>Failed to load PDF</div>
            <code style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 6 }}>{error}</code>
          </div>
        )}
        {!loading && !error && <canvas ref={canvasRef} style={{ maxWidth: '100%', boxShadow: '0 2px 12px rgba(0,0,0,.5)' }} />}
      </div>
    </>
  );
}

/** Fallback for truly unknown types — iframe embed attempt + open-in-tab link */
function FallbackViewer({ data, url, contentType, title }: { data?: string; url?: string; contentType: string; title: string }) {
  // Build a blob URL from base64 so the browser can try to render it inline
  const [blobUrl, setBlobUrl] = useState<string>('');
  useEffect(() => {
    if (data) {
      try {
        const bytes = b64ToBytes(data);
        const blob  = new Blob([bytes], { type: contentType });
        const bu    = URL.createObjectURL(blob);
        setBlobUrl(bu);
        return () => URL.revokeObjectURL(bu);
      } catch (_) {}
    }
  }, [data, contentType]);

  const src = blobUrl || url;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
      {/* Try iframe embed */}
      {src && (
        <iframe
          src={src}
          style={{ flex: 1, border: '0.5px solid var(--c-border)', borderRadius: 8, minHeight: 400 }}
          title={title}
        />
      )}
      {/* Always offer open-in-tab + download as backup */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            Open in new tab ↗
          </a>
        )}
        {data && (
          <a
            href={`data:${contentType};base64,${data}`}
            download={title || 'attachment'}
            className="btn btn-secondary"
          >
            ↓ Download
          </a>
        )}
        {!src && !data && (
          <div style={{ fontSize: 13, color: 'var(--c-text2)' }}>
            No content available for <code style={{ fontFamily: 'var(--font-mono)' }}>{contentType}</code>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="mv-placeholder">
      <div className="mv-spinner" />
      <div style={{ marginTop: 12, color: 'var(--c-text2)', fontSize: 13 }}>Loading…</div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────

interface Props {
  item: MediaItem | null;
  onClose: () => void;
}

export function MediaViewerModal({ item, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  const cat  = mimeCategory(item.contentType);
  const { data, url, contentType, title } = item;

  function renderBody() {
    switch (cat) {
      case 'pdf':   return <PdfViewer    data={data} url={url} />;
      case 'image': return <ImageViewer  data={data} url={url} contentType={contentType} />;
      case 'text':  return <TextViewer   data={data} url={url} />;
      case 'json':  return <JsonViewer   data={data} url={url} />;
      default:      return <FallbackViewer data={data} url={url} contentType={contentType} title={title} />;
    }
  }

  const categoryLabel: Record<string, string> = {
    pdf: '📄 PDF', image: '🖼️ Image', text: '📝 Text', json: '{ } JSON',
  };

  return (
    <div className="mv-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mv-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mv-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div className="mv-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title || 'Attachment'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text3)', fontFamily: 'var(--font-mono)' }}>
              {categoryLabel[cat] || cat} · {contentType}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} title="Close (Esc)" style={{ flexShrink: 0 }}>✕</button>
        </div>

        {/* Content (fills remaining height) */}
        <div className="mv-body" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderBody()}
        </div>
      </div>
    </div>
  );
}
