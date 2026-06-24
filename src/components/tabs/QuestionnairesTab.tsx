import { useMemo, useState } from 'react';
import { useFhir } from '../../context/FhirContext';
import { cap } from '../../lib/helpers';
import type { FhirQuestionnaire, FhirQuestionnaireItem } from '../../lib/types';

function answerText(opt: { valueString?: string; valueCoding?: { display?: string; code?: string }; valueInteger?: number }): string {
  if (opt.valueString != null) return opt.valueString;
  if (opt.valueInteger != null) return String(opt.valueInteger);
  return opt.valueCoding?.display || opt.valueCoding?.code || '';
}

function QuestionItem({ item, depth }: { item: FhirQuestionnaireItem; depth: number }) {
  const label = item.text || item.prefix || item.linkId || '—';
  const options = (item.answerOption || []).map(answerText).filter(Boolean);
  return (
    <div style={{ marginLeft: depth * 14, padding: '6px 0', borderTop: depth === 0 ? '0.5px solid var(--c-border)' : undefined }}>
      <div style={{ fontSize: 13 }}>
        {label}
        {item.required && <span className="tag tag-amber" style={{ fontSize: 10, marginLeft: 6 }}>required</span>}
        {item.type && <span style={{ fontSize: 11, color: 'var(--c-text3)', marginLeft: 6 }}>({item.type})</span>}
      </div>
      {options.length > 0 && (
        <div className="prism-flex prism-flex-wrap prism-gap-5" style={{ marginTop: 4 }}>
          {options.map((o, i) => <span key={i} className="tag tag-gray">{o}</span>)}
        </div>
      )}
      {(item.item || []).map((child, i) => <QuestionItem key={i} item={child} depth={depth + 1} />)}
    </div>
  );
}

export function QuestionnairesTab() {
  const { resourceMap } = useFhir();
  const list = useMemo(() => (resourceMap['Questionnaire'] || []) as FhirQuestionnaire[], [resourceMap]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(qn =>
      (qn.title || '').toLowerCase().includes(q) ||
      (qn.name || '').toLowerCase().includes(q) ||
      (qn.id || '').toLowerCase().includes(q)
    );
  }, [list, query]);

  if (!list.length) return <div className="empty-state">No questionnaires.</div>;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={`Search ${list.length} questionnaires by title…`}
        style={{
          width: '100%', padding: '8px 12px', marginBottom: 12, fontSize: 13,
          border: '0.5px solid var(--c-border)', borderRadius: 'var(--radius)',
          background: 'var(--c-surface)', color: 'var(--c-text)',
        }}
      />
      <div style={{ fontSize: 12, color: 'var(--c-text3)', marginBottom: 8 }}>
        Showing {filtered.length} of {list.length}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {filtered.map((qn, i) => {
          const title = qn.title || qn.name || qn.id || 'Questionnaire';
          const items = qn.item || [];
          return (
            <details key={i} style={{ borderBottom: '0.5px solid var(--c-border)' }}>
              <summary style={{ cursor: 'pointer', padding: '10px 14px', listStyle: 'revert' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
                <span style={{ fontSize: 11, color: 'var(--c-text3)', marginLeft: 8 }}>
                  #{qn.id} · {items.length} question{items.length === 1 ? '' : 's'}
                </span>
                {qn.status && <span className="tag tag-gray" style={{ fontSize: 10, marginLeft: 8 }}>{cap(qn.status)}</span>}
              </summary>
              <div style={{ padding: '4px 14px 12px' }}>
                {items.length
                  ? items.map((it, j) => <QuestionItem key={j} item={it} depth={0} />)
                  : <div className="row-detail">No questions.</div>}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
