import { Flag, FlagState, FlagSeverity } from './types';
import { apiFetch } from '../../lib/apiClient';

export const mockFlagsList: Flag[] = [
  {
    id: 'flag-spike-001',
    ruleId: 'rule-mom-spike',
    ruleCode: 'MOM_SPIKE',
    severity: 'Critical',
    period: '2026-09',
    titleBn: 'ডিজেল ব্যবহার অস্বাভাবিক বৃদ্ধি (১.৪৫ গুণ স্পাইক)',
    titleEn: 'Abnormal Diesel Fuel Surge (1.45x Spikes)',
    explanationBn: 'জেনারেটর ১-এ আগস্ট মাসের তুলনায় ডিজেল খরচ ৪৫% বৃদ্ধি পেয়েছে। এটি সাম্প্রতিক ৩ মাসের মধ্যবর্তী মানের চেয়ে ১.৪৫ গুণ বেশি।',
    explanationEn: 'Generator 1 diesel consumption increased 45% vs August, which is 1.45x higher than the trailing 3-month median baseline.',
    suggestedActionBn: 'জেনারেটরের রক্ষণাবেক্ষণ লগ পরীক্ষা করুন অথবা ফ্লোর অপারেটরের সাথে জ্বালানি স্লিপের সত্যতা যাচাই করুন।',
    suggestedActionEn: 'Inspect generator maintenance logs or verify diesel delivery receipts with floor staff Jahid.',
    state: 'Open',
    evidence: {
      assetName: 'Generator 1 (500 kVA Caterpillar)',
      measuredValue: 3450,
      expectedValue: 2380,
      unit: 'Litres',
      ratio: 1.45,
    },
  },
  {
    id: 'flag-missing-002',
    ruleId: 'rule-missing-doc',
    ruleCode: 'MISSING_DOC',
    severity: 'Warning',
    period: '2026-09',
    titleBn: 'অনুপস্থিত ডিজেল স্লিপ: জেনারেটর ২ (২টি বকেয়া)',
    titleEn: 'Missing Diesel Slips: Generator 2 (2 pending)',
    explanationBn: 'সেপ্টেম্বর মাসের বিলিং চক্র শেষ হলেও জেনারেটর ২-এর ২টি জ্বালানি স্লিপ এখনও আপলোড করা হয়নি।',
    explanationEn: 'Expected delivery slips for Generator 2 have not been submitted for the September billing reconciliation cycle.',
    suggestedActionBn: 'ফ্লোর স্টাফকে রসিদ জমা দেওয়ার তাগিদ পাঠান অথবা অ্যাকাউন্টিং ক্যাশ ভাউচার থেকে মান প্রবেশ করান।',
    suggestedActionEn: 'Nudge floor operator to capture slips via Floor PWA or enter manual cash voucher in Review Queue.',
    state: 'Open',
    evidence: {
      assetName: 'Generator 2 (250 kVA Perkins)',
      expectedValue: 2,
      unit: 'Slips',
    },
  },
  {
    id: 'flag-ocr-003',
    ruleId: 'rule-low-ocr',
    ruleCode: 'LOW_OCR_CONFIDENCE',
    severity: 'Warning',
    period: '2026-09',
    titleBn: 'বয়লার গ্যাস বিল: নিম্ন OCR নির্ভরযোগ্যতা (৫৪%)',
    titleEn: 'Boiler Gas Bill: Low OCR Confidence (54%)',
    explanationBn: 'তিতাস গ্যাসের চালানটির ছবি অস্পষ্ট বা ভাঁজযুক্ত থাকায় OCR নির্ভরযোগ্যতা ৭৫% থ্রেশহোল্ডের নিচে (৫৪%) নেমেছে।',
    explanationEn: 'Document scan is partially blurred or wrinkled; OCR confidence dropped to 54%, below the 75% auto-confirm threshold.',
    suggestedActionBn: 'পর্যালোচনা কিউতে গিয়ে চালানটির গ্যাস ব্যবহারের সংখ্যা নিজ হাতে যাচাই বা সংশোধন করুন।',
    suggestedActionEn: 'Open Review Workspace to visually inspect the document image and verify gas consumption figures.',
    state: 'Open',
    evidence: {
      documentId: 'doc-titas-gas-sep-26',
      documentType: 'Gas Utility Bill',
      assetName: 'Steam Boiler 1',
      measuredValue: 5200,
      unit: 'm³',
    },
  },
  {
    id: 'flag-pf-004',
    ruleId: 'rule-pf-penalty',
    ruleCode: 'POWER_FACTOR_PENALTY',
    severity: 'Info',
    period: '2026-09',
    titleBn: 'পাওয়ার ফ্যাক্টর সারচার্জ জরিমানা সনাক্তকরণ',
    titleEn: 'Low Power Factor Surcharge Detected on Bill',
    explanationBn: 'ডেসকো (DESCO) গ্রিড বিদ্যুৎ বিলে ৩,৪৫০ টাকা লো-পাওয়ার ফ্যাক্টর (PF < 0.90) জরিমানা ধার্য করা হয়েছে।',
    explanationEn: 'DESCO electricity invoice incurred a BDT 3,450 penalty surcharge because factory power factor dropped below 0.90.',
    suggestedActionBn: 'ক্যাপাসিটর ব্যাংক মেরামত করুন। এটি বিদ্যুৎ জরিমানা শূন্য করবে এবং বার্ষিক ১,২০,০০০ টাকা সাশ্রয় করবে।',
    suggestedActionEn: 'Inspect APFC capacitor bank. Eliminating this surcharge will save approximately BDT 120,000/year.',
    state: 'Open',
    evidence: {
      documentId: 'doc-desco-sep-26',
      documentType: 'Grid Electricity Bill',
      measuredValue: 3450,
      unit: 'BDT Surcharge',
    },
  },
  {
    id: 'flag-est-005',
    ruleId: 'rule-high-est',
    ruleCode: 'HIGH_ESTIMATED_SHARE',
    severity: 'Warning',
    period: '2026-08',
    titleBn: 'আগস্ট মাসে অনুমিত নির্গমন ১০% থ্রেশহোল্ড অতিক্রম করেছে',
    titleEn: 'August Estimated Emissions Share Exceeded 10%',
    explanationBn: 'অনুপস্থিত চালান ও প্রক্সির কারণে আগস্ট মাসের মোট নির্গমনের ১২.৫% অনুমিত ধরা হয়েছে, যা অডিট মানের চেয়ে বেশি।',
    explanationEn: 'Estimated proxy data accounted for 12.5% of August footprint, exceeding the 10% maximum audit threshold.',
    suggestedActionBn: 'অনুপস্থিত চালানসমূহ সংগ্রহ করে মূল বিল নিশ্চিত করুন যাতে প্রতিবেদনটি অডিটের জন্য নির্ভরযোগ্য হয়।',
    suggestedActionEn: 'Collect missing historical slips to replace proxy estimates before final buyer report submission.',
    state: 'Acknowledged',
    evidence: {
      measuredValue: 12.5,
      expectedValue: 10.0,
      unit: '% estimated share',
    },
  },
];

const ruleTitleDictionary: Record<string, { bn: string; en: string }> = {
  MISSING_DOCUMENT: {
    bn: 'অনুপস্থিত চালান বা বিল',
    en: 'Missing Bill or Meter Slip',
  },
  LOW_OCR_CONFIDENCE: {
    bn: 'কম ওলসিআর কনফিডেন্স যাচাই',
    en: 'Low OCR Confidence Verification',
  },
  DUPLICATE_SUSPECTED: {
    bn: 'সম্ভাব্য ডুপ্লিকেট চালান সনাক্ত',
    en: 'Duplicate Slip Suspected',
  },
  IMPLAUSIBLE_VALUE: {
    bn: 'অস্বাভাবিক ডেটা মান (IQR সীমার বাইরে)',
    en: 'Implausible Metric (Outside IQR Bounds)',
  },
  ESTIMATED_SHARE_HIGH: {
    bn: 'উচ্চ অনুমাননির্ভর ডেটা (>১০%)',
    en: 'High Estimated Footprint Share',
  },
  SPIKE_MOM: {
    bn: 'মাসিক ব্যবহারে অস্বাভাবিক বৃদ্ধি (স্পাইক)',
    en: 'Month-on-Month Consumption Surge',
  },
  HOTSPOT_DETECTED: {
    bn: 'কার্বন হটস্পট সনাক্তকরণ',
    en: 'Major Carbon Hotspot Detected',
  },
  GENSET_RELIANCE: {
    bn: 'ডিজেল জেনারেটরের উপর অতিরিক্ত নির্ভরতা',
    en: 'High Diesel Generator Reliance',
  },
  POWER_FACTOR_PENALTY: {
    bn: 'পাওয়ার ফ্যাক্টর সারচার্জ জরিমানা সনাক্তকরণ',
    en: 'Low Power Factor Surcharge Detected on Bill',
  },
  REPORT_NOT_READY: {
    bn: 'রিপোর্ট অডিট-উপযোগী নয়',
    en: 'Report Not Audit-Ready',
  },
  FACTOR_OUTDATED: {
    bn: 'পুরোনো নির্গমন ফ্যাক্টর সেট',
    en: 'Outdated Emission Factor Set',
  },
};

export function mapBackendFlag(raw: any): Flag {
  const titles = ruleTitleDictionary[raw.ruleCode] || {
    bn: raw.explanationBn?.slice(0, 45) || 'কার্বন সতর্কতা',
    en: raw.explanationEn?.slice(0, 45) || 'Carbon Flag',
  };

  const sevLower = String(raw.severity || '').toLowerCase();
  let severity: FlagSeverity = 'Warning';
  if (sevLower === 'red' || sevLower === 'critical') severity = 'Critical';
  else if (sevLower === 'info') severity = 'Info';

  let evidence: any = {};
  if (raw.evidenceJson) {
    try {
      const parsed = typeof raw.evidenceJson === 'string' ? JSON.parse(raw.evidenceJson) : raw.evidenceJson;
      if (parsed.missingDocuments && Array.isArray(parsed.missingDocuments) && parsed.missingDocuments.length > 0) {
        evidence.assetName = parsed.missingDocuments[0]?.assetName || 'Utility Meter';
        evidence.expectedValue = parsed.missingDocuments.length;
        evidence.unit = 'Slips';
      } else if (parsed.powerFactor !== undefined) {
        evidence.measuredValue = parsed.powerFactor;
        evidence.unit = 'Power Factor (PF)';
        evidence.documentId = parsed.documentId;
      } else if (parsed.penaltyAmount !== undefined) {
        evidence.measuredValue = parsed.penaltyAmount;
        evidence.unit = 'BDT Penalty';
        evidence.documentId = parsed.documentId;
      } else if (parsed.currentMonthValue !== undefined) {
        evidence.measuredValue = Math.round(parsed.currentMonthValue);
        evidence.expectedValue = Math.round(parsed.trailingMedian || 0);
        evidence.unit = 'kg CO₂e';
        evidence.ratio = parsed.ratio;
      } else if (parsed.percentage !== undefined) {
        evidence.measuredValue = parsed.percentage;
        evidence.unit = '% share';
      } else if (parsed.lowConfidenceDocuments && Array.isArray(parsed.lowConfidenceDocuments) && parsed.lowConfidenceDocuments.length > 0) {
        evidence.documentId = parsed.lowConfidenceDocuments[0]?.documentId;
        evidence.measuredValue = Math.round((parsed.lowConfidenceDocuments[0]?.minConfidence || 0.6) * 100);
        evidence.unit = '% OCR Confidence';
      } else {
        evidence = parsed;
      }
    } catch {
      evidence = {};
    }
  }

  return {
    id: raw.id,
    ruleId: raw.ruleId || raw.id,
    ruleCode: raw.ruleCode,
    severity,
    period: raw.period || '2026-09',
    titleBn: raw.titleBn || titles.bn,
    titleEn: raw.titleEn || titles.en,
    explanationBn: raw.explanationBn || titles.bn,
    explanationEn: raw.explanationEn || titles.en,
    suggestedActionBn: raw.suggestedActionBn || '',
    suggestedActionEn: raw.suggestedActionEn || '',
    state: (raw.state || 'Open') as FlagState,
    evidence,
    dismissedReason: raw.dismissedReason,
    expiresAt: raw.dismissedUntil,
  };
}

let inMemoryFlags = [...mockFlagsList];

export async function fetchFlags(state?: string, period?: string): Promise<Flag[]> {
  try {
    const params = new URLSearchParams();
    if (state && state !== 'all') params.append('state', state);
    if (period && period !== 'all') params.append('period', period);
    const qs = params.toString();
    const url = `/api/v1/flags${qs ? `?${qs}` : ''}`;
    const rawList = await apiFetch<any[]>(url);
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map(mapBackendFlag);
    }
    return inMemoryFlags;
  } catch {
    let filtered = [...inMemoryFlags];
    if (state && state !== 'all') {
      filtered = filtered.filter((f) => f.state.toLowerCase() === state.toLowerCase());
    }
    if (period) {
      filtered = filtered.filter((f) => f.period === period);
    }
    return filtered;
  }
}

export async function triggerFlagEvaluation(period: string = '2026-09'): Promise<void> {
  try {
    await fetch(`/api/v1/flags/evaluate?period=${encodeURIComponent(period)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Ignore error
  }
}

export async function acknowledgeFlag(id: string): Promise<boolean> {
  try {
    await apiFetch(`/api/v1/flags/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' });
  } catch {
    // fallback
  }
  inMemoryFlags = inMemoryFlags.map((f) => (f.id === id ? { ...f, state: 'Acknowledged' } : f));
  return true;
}

export async function dismissFlag(id: string, reason: string): Promise<boolean> {
  try {
    await apiFetch(`/api/v1/flags/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  } catch {
    // fallback
  }
  const now = new Date();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days expiry

  inMemoryFlags = inMemoryFlags.map((f) =>
    f.id === id
      ? {
          ...f,
          state: 'Dismissed',
          dismissedReason: reason,
          dismissedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        }
      : f
  );
  return true;
}

export async function snoozeFlag(id: string, days: number, reason: string): Promise<boolean> {
  try {
    await apiFetch(`/api/v1/flags/${encodeURIComponent(id)}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ days, reason }),
    });
  } catch {
    // fallback
  }
  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + days);

  inMemoryFlags = inMemoryFlags.map((f) =>
    f.id === id
      ? {
          ...f,
          snoozedUntil: snoozeDate.toISOString(),
        }
      : f
  );
  return true;
}
