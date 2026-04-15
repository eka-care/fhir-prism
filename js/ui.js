/**
 * ui.js
 * DOM event handlers and UI feedback utilities.
 * Handles: dropzone, file input, paste, status indicator, toast, back navigation.
 * Depends on: state.js, parser.js.
 */

// ─── Dropzone ──────────────────────────────────────────────────────────────

/** Prevents default drag behaviour and adds the hover highlight. */
function handleDropzoneOver(event) {
  event.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}

/** Removes the dropzone hover highlight when the drag leaves. */
function handleDropzoneLeave() {
  document.getElementById('dropzone').classList.remove('drag-over');
}

/** Handles a file dropped onto the dropzone. */
function handleDropzoneDrop(event) {
  event.preventDefault();
  handleDropzoneLeave();
  const droppedFile = event.dataTransfer.files[0];
  if (droppedFile) readFileAsText(droppedFile);
}

// ─── File input ────────────────────────────────────────────────────────────

/** Called when the user picks a file via the hidden file input. */
function handleFileInputChange(event) {
  if (event.target.files[0]) readFileAsText(event.target.files[0]);
}

/** Reads a File object as UTF-8 text and passes the result to parseBundle. */
function readFileAsText(file) {
  const reader = new FileReader();
  reader.onload = loadEvent => parseBundle(loadEvent.target.result);
  reader.readAsText(file);
}

// ─── Paste area ────────────────────────────────────────────────────────────

/** Reads the paste textarea and triggers parsing. */
function loadPastedJson() {
  const pastedText = document.getElementById('paste-input').value.trim();
  if (!pastedText) { showToast('Paste JSON first'); return; }
  parseBundle(pastedText);
}

// ─── Navigation ────────────────────────────────────────────────────────────

/** Hides the record view and returns to the upload panel, resetting state. */
function goBackToUpload() {
  document.getElementById('record').style.display      = 'none';
  document.getElementById('upload-panel').style.display = 'block';

  // Reset shared state
  resourceMap     = {};
  rawBundle       = null;
  activeTabs      = [];
  currentDocType  = { ...DEFAULT_DOC_TYPE };

  setStatusIndicator(null, 'Load a FHIR document to begin');
}

// ─── Status indicator ──────────────────────────────────────────────────────

/**
 * Updates the status dot colour and label in the topbar.
 *
 * @param {string|null} status  - 'ok' | 'err' | 'loading' | null (resets)
 * @param {string}      [message] - Text to display next to the dot
 */
function setStatusIndicator(status, message) {
  const dotEl  = document.getElementById('status-dot');
  const textEl = document.getElementById('status-text');
  if (status !== undefined) dotEl.className  = status || '';
  if (message !== undefined) textEl.textContent = message;
}

// ─── Toast notification ────────────────────────────────────────────────────

let _toastTimer = null;

/**
 * Shows a brief toast message at the bottom of the screen.
 *
 * @param {string} message - The text to display.
 */
function showToast(message) {
  const toastEl = document.getElementById('toast-notification');
  toastEl.textContent = message;
  toastEl.classList.add('visible');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2800);
}
