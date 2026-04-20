import { useFhir } from './context/FhirContext';
import { Topbar }      from './components/Topbar';
import { UploadPanel } from './components/UploadPanel';
import { RecordView }  from './components/RecordView';

export default function App() {
  const { view, toast } = useFhir();

  return (
    <div style={{ minHeight: '100vh' }} className='prism-bg-surface-subtle'>
      <Topbar />
      {view === 'upload' ? <UploadPanel /> : <RecordView />}
      <div className={`toast${toast ? ' visible' : ''}`}>{toast}</div>
    </div>
  );
}
