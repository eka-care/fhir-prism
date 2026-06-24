import { create } from 'zustand';
import type { ResourceMap, FhirBundle, DocType } from '../lib/types';
import { DEFAULT_DOC_TYPE, NHCX_FOCUS_TYPES } from '../lib/constants';
import { parseBundle as doParse } from '../lib/parser';

export interface StatusInfo {
  type: 'ok' | 'err' | 'loading' | null;
  text: string;
}

interface FhirState {
  resourceMap: ResourceMap;
  rawBundle: FhirBundle | null;
  docType: DocType;
  view: 'upload' | 'record';
  status: StatusInfo;
  toast: string;
  pasteText: string;
  setPasteText: (text: string) => void;
  showToast: (msg: string) => void;
  loadJson: (jsonText: string) => void;
  goBack: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useFhirStore = create<FhirState>((set, get) => ({
  resourceMap: {},
  rawBundle: null,
  docType: { ...DEFAULT_DOC_TYPE },
  view: 'upload',
  status: { type: null, text: 'Load a FHIR document to begin' },
  toast: '',
  pasteText: '',
  setPasteText: (text: string) => set({ pasteText: text }),

  showToast: (msg: string) => {
    set({ toast: msg });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: '' }), 2800);
  },

  loadJson: (jsonText: string) => {
    const result = doParse(jsonText);
    const { showToast } = get();
    if (result.error) {
      showToast(result.error);
      set({ status: { type: 'err', text: result.error } });
      return;
    }
    // Clinical bundles are patient-centric; NHCX insurance bundles (e.g. an
    // InsurancePlan catalog or a claim/eligibility message) may legitimately
    // carry no Patient, so also accept a recognized NHCX focus resource.
    const hasPatient = !!result.resourceMap['Patient']?.length;
    const hasNhcxFocus = NHCX_FOCUS_TYPES.some(t => result.resourceMap[t]?.length);
    if (!hasPatient && !hasNhcxFocus) {
      showToast('No Patient or insurance resource found');
      set({ status: { type: 'err', text: 'No Patient or insurance resource found' } });
      return;
    }
    const totalEntries = (result.rawBundle.entry || []).length;
    const types = Object.keys(result.resourceMap).join(' · ');
    set({
      resourceMap: result.resourceMap,
      rawBundle: result.rawBundle,
      docType: result.docType,
      status: { type: 'ok', text: `${totalEntries} resources · ${types}` },
      view: 'record',
    });
  },

  goBack: () => {
    set({
      view: 'upload',
      resourceMap: {},
      rawBundle: null,
      docType: { ...DEFAULT_DOC_TYPE },
      status: { type: null, text: 'Load a FHIR document to begin' },
    });
  },
}));
