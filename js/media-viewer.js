/**
 * media-viewer.js
 * Modal viewer for base64-encoded images and PDFs.
 * Uses PDF.js (loaded from CDN) for PDF rendering.
 * Depends on: nothing (standalone module).
 */

// ─── Attachment registry ───────────────────────────────────────────────────
// Stores base64 payloads keyed by a generated ID so onclick attributes
// never embed megabytes of data inline.

const _attachmentRegistry = {};

/**
 * Registers a base64 attachment and returns a lookup ID.
 * @param {string} data        - raw base64 string (no data-URI prefix)
 * @param {string} contentType - MIME type, e.g. "application/pdf"
 * @param {string} title       - display title for the viewer header
 * @returns {string} id
 */
function registerAttachment(data, contentType, title) {
  const id = 'att_' + Math.random().toString(36).slice(2, 10);
  _attachmentRegistry[id] = { data, contentType, title };
  return id;
}

/**
 * Opens the media viewer for a previously registered attachment.
 * @param {string} id
 */
function openMediaViewerById(id) {
  const att = _attachmentRegistry[id];
  if (att) openMediaViewer(att.data, att.contentType, att.title);
}

// ─── PDF.js state ─────────────────────────────────────────────────────────

let _pdfDoc        = null;
let _currentPage   = 1;
let _totalPages    = 0;
let _renderTask    = null;   // in-flight render task, used to cancel on page change

// ─── Main viewer entry point ───────────────────────────────────────────────

/**
 * Opens the modal viewer for a base64-encoded attachment.
 * @param {string} base64Data  - raw base64 (no data-URI prefix)
 * @param {string} contentType - MIME type
 * @param {string} title       - display title
 */
function openMediaViewer(base64Data, contentType, title) {
  const modal      = document.getElementById('media-viewer-modal');
  const titleEl    = document.getElementById('media-viewer-title');
  const bodyEl     = document.getElementById('media-viewer-body');
  const pdfCtrl    = document.getElementById('pdf-page-controls');

  // Reset state
  _pdfDoc = null;
  _currentPage = 1;
  _totalPages = 0;

  titleEl.textContent   = title || 'Attachment';
  bodyEl.innerHTML      = '';
  bodyEl.style.padding  = '';   // reset to CSS default (20px)
  pdfCtrl.style.display = 'none';
  modal.style.display   = 'flex';
  document.body.style.overflow = 'hidden';

  const type = (contentType || '').toLowerCase();

  if (type.includes('pdf')) {
    _renderPdf(base64Data);
  } else if (type.startsWith('image/') || type.includes('image')) {
    _renderImage(base64Data, contentType);
  } else if (type === 'text/plain' || type === 'application/json' || type.includes('text')) {
    _renderBase64Text(base64Data, type);
  } else {
    // Unknown type — offer a download link
    const safeType = contentType.replace(/"/g, '');
    bodyEl.innerHTML = `
      <div class="mv-placeholder">
        <div class="mv-placeholder-icon">📎</div>
        <div>Cannot preview this file type:</div>
        <code style="font-family:var(--font-mono);font-size:12px;color:var(--color-text2)">${safeType}</code>
        <a href="data:${safeType};base64,${base64Data}"
           download="attachment"
           class="btn btn-primary"
           style="margin-top:12px">Download file</a>
      </div>`;
  }
}

/**
 * Opens the modal viewer for a URL-based document.
 * Renders in-modal without redirecting to a new tab.
 * @param {string} url         - document URL
 * @param {string} contentType - MIME type (may be empty; inferred from URL extension)
 * @param {string} title       - display title
 */
async function openMediaViewerByUrl(url, contentType, title) {
  const modal   = document.getElementById('media-viewer-modal');
  const titleEl = document.getElementById('media-viewer-title');
  const bodyEl  = document.getElementById('media-viewer-body');
  const pdfCtrl = document.getElementById('pdf-page-controls');

  _pdfDoc = null;
  _currentPage = 1;
  _totalPages = 0;

  titleEl.textContent   = title || 'Document';
  bodyEl.innerHTML      = '';
  bodyEl.style.padding  = '';   // reset to CSS default (20px)
  pdfCtrl.style.display = 'none';
  modal.style.display   = 'flex';
  document.body.style.overflow = 'hidden';

  // Infer type from URL extension if contentType is absent
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
  const EXT_MIME = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    txt: 'text/plain', json: 'application/json',
  };
  const type = ((contentType || EXT_MIME[ext] || '')).toLowerCase();

  if (type.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) {
    bodyEl.style.padding = '20px';
    bodyEl.innerHTML = `<img src="${url}" class="mv-image" alt="${escapeHtml(title || 'Image')}">`;
  } else if (type === 'text/plain' || type === 'application/json' || ['txt','json'].includes(ext)) {
    bodyEl.innerHTML = `<div class="mv-placeholder"><div class="mv-spinner"></div><div style="margin-top:12px;color:var(--color-text2)">Loading…</div></div>`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      let display = text;
      if (type === 'application/json' || ext === 'json') {
        try { display = JSON.stringify(JSON.parse(text), null, 2); } catch (_) {}
      }
      bodyEl.style.padding = '20px';
      bodyEl.innerHTML = `<pre class="mv-text-content">${escapeHtml(display)}</pre>`;
    } catch (err) {
      bodyEl.innerHTML = `<div class="mv-placeholder"><div class="mv-placeholder-icon">⚠️</div><div style="color:var(--color-text2)">Failed to load document</div><code style="font-size:11px;color:var(--color-text3);margin-top:6px">${escapeHtml(err.message)}</code></div>`;
    }
  } else {
    // PDF or unknown — open in a new tab
    modal.style.display = 'none';
    document.body.style.overflow = '';
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ─── Image renderer ────────────────────────────────────────────────────────

function _renderImage(base64Data, contentType) {
  const bodyEl = document.getElementById('media-viewer-body');
  const dataUrl = `data:${contentType};base64,${base64Data}`;
  bodyEl.innerHTML = `<img src="${dataUrl}" class="mv-image" alt="Attachment image">`;
}

// ─── Text / JSON renderer (base64) ────────────────────────────────────────

function _renderBase64Text(base64Data, contentType) {
  const bodyEl = document.getElementById('media-viewer-body');
  try {
    let text = atob(base64Data);
    if (contentType === 'application/json') {
      try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (_) {}
    }
    bodyEl.style.padding = '20px';
    bodyEl.innerHTML = `<pre class="mv-text-content">${escapeHtml(text)}</pre>`;
  } catch (err) {
    bodyEl.innerHTML = `<div class="mv-placeholder"><div class="mv-placeholder-icon">⚠️</div><div style="color:var(--color-text2)">Failed to decode text</div></div>`;
  }
}

// ─── PDF renderer (PDF.js) ─────────────────────────────────────────────────

async function _renderPdf(base64Data) {
  const bodyEl  = document.getElementById('media-viewer-body');
  const pdfCtrl = document.getElementById('pdf-page-controls');

  bodyEl.innerHTML = `
    <div class="mv-placeholder">
      <div class="mv-spinner"></div>
      <div style="margin-top:12px;color:var(--color-text2)">Loading PDF…</div>
    </div>`;

  try {
    // Ensure PDF.js worker is configured
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Check your internet connection.');
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Decode base64 → Uint8Array
    const binary = atob(base64Data);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    _pdfDoc     = await pdfjsLib.getDocument({ data: bytes }).promise;
    _totalPages = _pdfDoc.numPages;
    _currentPage = 1;

    // Build canvas + controls
    bodyEl.innerHTML = `<canvas id="pdf-canvas" class="mv-pdf-canvas"></canvas>`;
    pdfCtrl.style.display = 'flex';
    document.getElementById('pdf-page-total').textContent = _totalPages;

    await _renderPdfPage(_currentPage);
  } catch (err) {
    bodyEl.innerHTML = `
      <div class="mv-placeholder">
        <div class="mv-placeholder-icon">⚠️</div>
        <div style="color:var(--color-text2)">Failed to load PDF</div>
        <code style="font-size:11px;color:var(--color-text3);margin-top:6px">${err.message}</code>
      </div>`;
  }
}

async function _renderPdfPage(pageNum) {
  if (!_pdfDoc) return;

  // Cancel any in-flight render
  if (_renderTask) { try { _renderTask.cancel(); } catch (_) {} }

  const page   = await _pdfDoc.getPage(pageNum);
  const canvas = document.getElementById('pdf-canvas');
  if (!canvas) return;

  // Scale to fit the container width, max 2× device pixel ratio
  const dpr           = window.devicePixelRatio || 1;
  const containerW    = (canvas.parentElement?.clientWidth || 800) - 32;
  const baseViewport  = page.getViewport({ scale: 1 });
  const scale         = Math.min(containerW / baseViewport.width, 2) * dpr;
  const viewport      = page.getViewport({ scale });

  canvas.width  = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width  = `${viewport.width / dpr}px`;
  canvas.style.height = `${viewport.height / dpr}px`;

  _renderTask = page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  });
  await _renderTask.promise;
  _renderTask = null;

  document.getElementById('pdf-page-current').textContent = pageNum;
}

// ─── Page navigation ───────────────────────────────────────────────────────

async function pdfPrevPage() {
  if (!_pdfDoc || _currentPage <= 1) return;
  _currentPage--;
  await _renderPdfPage(_currentPage);
}

async function pdfNextPage() {
  if (!_pdfDoc || _currentPage >= _totalPages) return;
  _currentPage++;
  await _renderPdfPage(_currentPage);
}

// ─── Close ─────────────────────────────────────────────────────────────────

function closeMediaViewer() {
  const modal = document.getElementById('media-viewer-modal');
  modal.style.display = 'none';
  document.body.style.overflow = '';

  // Cancel in-flight render and release PDF doc
  if (_renderTask) { try { _renderTask.cancel(); } catch (_) {} _renderTask = null; }
  if (_pdfDoc)     { _pdfDoc.destroy(); _pdfDoc = null; }

  _currentPage = 1;
  _totalPages  = 0;

  document.getElementById('media-viewer-body').innerHTML      = '';
  document.getElementById('pdf-page-controls').style.display = 'none';
}

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('media-viewer-modal');
    if (modal && modal.style.display !== 'none') closeMediaViewer();
  }
});
