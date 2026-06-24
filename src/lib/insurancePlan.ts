import type { FhirResource } from './types';

// ─── Normalised view model for the InsurancePlan tab ─────────────────────────
// FHIR InsurancePlan packs most of the claim-relevant detail into nested
// extensions (Claim-Condition, Claim-SupportingInfoRequirement), per-benefit
// limits, and plan.specificCost. This module flattens all of that into a flat
// structure the tab can render directly.

export interface PlanDocReq {
  category: string;
  code: string;
}

export interface PlanCondition {
  label: string;
  value: string;
}

export interface PlanBenefitView {
  code: string;
  name: string;
  cost: string;       // joined from plan.specificCost
  limit: string;      // benefit.limit
  conditions: PlanCondition[];
  docs: PlanDocReq[];        // benefit-specific mandatory documents
  stgRefs: string[];         // STG / questionnaire references
}

export interface PlanCategoryView {
  code: string;
  label: string;
  benefits: PlanBenefitView[];
}

export interface PlanIdentifierView {
  label: string;
  value: string;
}

export interface InsurancePlanView {
  name: string;
  type: string;
  status: string;
  period: string;
  owner: string;
  admin: string;
  planType: string;
  sumInsured: string;
  identifiers: PlanIdentifierView[];
  tariffVersion: string;
  policyDocs: PlanDocReq[];   // policy-level mandatory documents
  benefitCount: number;
  categories: PlanCategoryView[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const lastSeg = (url?: string) => (url || '').split('/').pop() || '';

function fmtMoney(m?: { value?: number; currency?: string }): string {
  if (!m || m.value == null) return '';
  const sym = m.currency === 'INR' ? '₹' : m.currency ? `${m.currency} ` : '';
  return `${sym}${m.value.toLocaleString('en-IN')}`;
}

function fmtQuantity(q?: { value?: number; unit?: string }): string {
  if (!q || q.value == null) return '';
  if (q.unit === 'INR') return `₹${q.value.toLocaleString('en-IN')}`;
  return `${q.value.toLocaleString('en-IN')}${q.unit ? ` ${q.unit}` : ''}`;
}

// A SupportingInfoRequirement extension comes in two shapes:
//  • policy-level: sub-extensions carry category/code directly (one doc)
//  • benefit-level: sub-extensions are groups, each carrying its own category/code
function pairFrom(subs: any[]): { category: string; code: string; refs: string[] } {
  let category = '';
  let code = '';
  const refs: string[] = [];
  for (const s of subs || []) {
    if (s?.valueReference?.reference) refs.push(s.valueReference.reference);
    const coding = s?.valueCodeableConcept?.coding?.[0];
    if (!coding) continue;
    const label = coding.display || coding.code || '';
    if (/category/i.test(s.url)) category = label;
    else if (/code/i.test(s.url)) code = label;
  }
  return { category, code, refs };
}

function collectDocReqs(reqExt: any): { docs: PlanDocReq[]; stgRefs: string[] } {
  const docs: PlanDocReq[] = [];
  const stgRefs: string[] = [];
  const subs: any[] = reqExt?.extension || [];
  const groups = subs.filter(s => Array.isArray(s?.extension) && s.extension.length);
  const targets = groups.length ? groups.map(g => g.extension) : [subs];
  for (const t of targets) {
    const { category, code, refs } = pairFrom(t);
    if (category || code) docs.push({ category, code });
    stgRefs.push(...refs);
  }
  return { docs, stgRefs };
}

function collectConditions(benefit: any): PlanCondition[] {
  const ext = (benefit?.extension || []).find((e: any) => /Claim-Condition/.test(e?.url || ''));
  if (!ext) return [];
  return (ext.extension || [])
    .map((s: any) => ({
      label: lastSeg(s?.url),
      value: s?.valueString ?? (s?.valueBoolean != null ? String(s.valueBoolean) : s?.valueInteger != null ? String(s.valueInteger) : ''),
    }))
    .filter((c: PlanCondition) => c.label);
}

export function buildInsurancePlanView(ip: FhirResource): InsurancePlanView {
  const start = (ip.period?.start || '').slice(0, 10);
  const end = (ip.period?.end || '').slice(0, 10);

  // cost lookup: category code → benefit code → formatted cost
  const costMap: Record<string, Record<string, string>> = {};
  const plan0 = ip.plan?.[0];
  for (const sc of plan0?.specificCost || []) {
    const catCode = sc?.category?.coding?.[0]?.code || '';
    costMap[catCode] = costMap[catCode] || {};
    for (const bn of sc?.benefit || []) {
      const code = bn?.type?.coding?.[0]?.code || lastSeg(bn?.id);
      const c = bn?.cost?.[0];
      costMap[catCode][code] = fmtQuantity(c?.value) || fmtMoney(c?.amount);
    }
  }

  const categories: PlanCategoryView[] = (ip.coverage || []).map((c: any) => {
    const catCode = c?.type?.coding?.[0]?.code || '';
    const label = c?.type?.coding?.[0]?.display || c?.type?.text || catCode || 'Category';
    const benefits: PlanBenefitView[] = (c?.benefit || []).map((bn: any) => {
      const code = bn?.type?.coding?.[0]?.code || lastSeg(bn?.id);
      const name = bn?.type?.coding?.[0]?.display || code;
      const limit = fmtQuantity(bn?.limit?.[0]?.value);
      const cost = costMap[catCode]?.[code] || '';
      const conditions = collectConditions(bn);
      const siExt = (bn?.extension || []).find((e: any) => /SupportingInfoRequirement/.test(e?.url || ''));
      const { docs, stgRefs } = siExt ? collectDocReqs(siExt) : { docs: [], stgRefs: [] };
      return { code, name, cost, limit, conditions, docs, stgRefs };
    });
    return { code: catCode, label, benefits };
  });

  const identifiers: PlanIdentifierView[] = (ip.identifier || []).map((id: any) => ({
    label: id?.type?.coding?.[0]?.display || lastSeg(id?.system) || 'Identifier',
    value: id?.value || '',
  }));

  const tariffVersion =
    (ip.identifier || []).find((id: any) => id?.type?.coding?.[0]?.code === 'XV')?.value ||
    (ip.identifier || []).map((id: any) => id?.value).find((v: string) => /\/R\d|20\d\d/.test(v || '')) ||
    '';

  const policyDocs: PlanDocReq[] = [];
  for (const e of ip.extension || []) {
    if (/SupportingInfoRequirement/.test(e?.url || '')) {
      policyDocs.push(...collectDocReqs(e).docs);
    }
  }

  const benefitCount = categories.reduce((n, c) => n + c.benefits.length, 0);

  return {
    name: ip.name || '—',
    type: ip.type?.[0]?.coding?.[0]?.display || ip.type?.[0]?.text || 'Insurance Plan',
    status: ip.status || '—',
    period: start ? (end ? `${start} – ${end}` : `From ${start}`) : '',
    owner: ip.ownedBy?.display || ip.ownedBy?.reference || '',
    admin: ip.administeredBy?.display || ip.administeredBy?.reference || '',
    planType: plan0?.type?.coding?.[0]?.display || plan0?.type?.text || '',
    sumInsured: (plan0?.generalCost || []).map((g: any) => fmtMoney(g?.cost)).filter(Boolean).join(', '),
    identifiers,
    tariffVersion,
    policyDocs,
    benefitCount,
    categories,
  };
}
