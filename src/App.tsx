import { FhirProvider, useFhir } from './context/FhirContext';
import { Topbar }      from './components/Topbar';
import { UploadPanel } from './components/UploadPanel';
import { RecordView }  from './components/RecordView';

function AppShell() {
  const { view, toast } = useFhir();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      <Topbar />
      {view === 'upload' ? <UploadPanel /> : <RecordView />}
      <div className={`toast${toast ? ' visible' : ''}`}>{toast}</div>
    </div>
  );
}

export default function App() {
  return (
    <FhirProvider>
      <AppShell />
    </FhirProvider>
  );
}
