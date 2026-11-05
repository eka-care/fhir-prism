import { useFhir } from './context/FhirContext';
import { Topbar }      from './components/Topbar';
import { UploadPanel } from './components/UploadPanel';
import { RecordView }  from './components/RecordView';
import { Footer }      from './components/Footer';

export default function App() {
  const { view, toast } = useFhir();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      <Topbar />
      {view === 'upload' ? <UploadPanel /> : <RecordView />}
      <Footer />
      <div className={`toast${toast ? ' visible' : ''}`}>{toast}</div>
    </div>
  );
}
