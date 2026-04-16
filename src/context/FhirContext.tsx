import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { ResourceMap, FhirBundle, DocType } from '../lib/types';
import { DEFAULT_DOC_TYPE } from '../lib/constants';
import { parseBundle as doParse } from '../lib/parser';

interface StatusInfo {
  type: 'ok' | 'err' | 'loading' | null;
  text: string;
}

interface FhirContextValue {
  resourceMap: ResourceMap;
  rawBundle: FhirBundle | null;
  docType: DocType;
  view: 'upload' | 'record';
  status: StatusInfo;
  toast: string;
  showToast: (msg: string) => void;
  loadJson: (jsonText: string) => void;
  goBack: () => void;
}

const FhirContext = createContext<FhirContextValue | null>(null);

export function FhirProvider({ children }: { children: ReactNode }) {
  const [resourceMap, setResourceMap] = useState<ResourceMap>({});
  const [rawBundle, setRawBundle] = useState<FhirBundle | null>(null);
  const [docType, setDocType] = useState<DocType>({ ...DEFAULT_DOC_TYPE });
  const [view, setView] = useState<'upload' | 'record'>('upload');
  const [status, setStatus] = useState<StatusInfo>({ type: null, text: 'Load a FHIR document to begin' });
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const loadJson = useCallback((jsonText: string) => {
    const result = doParse(jsonText);
    if (result.error) {
      showToast(result.error);
      setStatus({ type: 'err', text: result.error });
      return;
    }
    if (!result.resourceMap['Patient']?.length) {
      showToast('No Patient resource found');
      setStatus({ type: 'err', text: 'No Patient resource found' });
      return;
    }
    const totalEntries = (result.rawBundle.entry || []).length;
    const types = Object.keys(result.resourceMap).join(' · ');
    setResourceMap(result.resourceMap);
    setRawBundle(result.rawBundle);
    setDocType(result.docType);
    setStatus({ type: 'ok', text: `${totalEntries} resources · ${types}` });
    setView('record');
  }, [showToast]);

  const goBack = useCallback(() => {
    setView('upload');
    setResourceMap({});
    setRawBundle(null);
    setDocType({ ...DEFAULT_DOC_TYPE });
    setStatus({ type: null, text: 'Load a FHIR document to begin' });
  }, []);

  return (
    <FhirContext.Provider value={{ resourceMap, rawBundle, docType, view, status, toast, showToast, loadJson, goBack }}>
      {children}
    </FhirContext.Provider>
  );
}

export function useFhir(): FhirContextValue {
  const ctx = useContext(FhirContext);
  if (!ctx) throw new Error('useFhir must be used inside FhirProvider');
  return ctx;
}
