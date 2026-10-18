import { Recommendation, RecommendationStatus, EvidenceGrade, RagAskResponse, RagCorpusSummary, DedicatedBreakdownResponse, RecalculateResponse } from './types';
import { apiFetch } from '../../lib/apiClient';

export const mockRecommendationsList: Recommendation[] = [
  {
    id: 'rec-apfc-001',
    measureCode: 'PFL-EE-002',
    titleBn: 'পাওয়ার ফ্যাক্সর অটোমেটিক ক্যাপাসিটর ব্যাংক (APFC) সংস্কার',
    titleEn: 'Automatic Power Factor Correction (APFC) Capacitor Bank Refurbishment',
    category: 'Electricity',
    evidenceGrade: 'A',
    sourceCitation: 'DESCO Industrial Tariff Penalty Schedule & IFC PaCT Textile Energy Audit Guide (2023)',
    sourceUrl: 'https://pact-bangladesh.org',
    applicabilityBn: 'ডেসকো বিলে পাওয়ার ফ্যাক্টর জরিমানা (PF < 0.90) আরোপিত কারখানাসমূহের জন্য প্রযোজ্য।',
    applicabilityEn: 'Applicable to industrial facilities incurring low power factor penalty surcharges.',
    assumptionsBn: 'কারখানার নিজস্ব সেপ্টেম্বর মাসের বিদ্যুৎ বিল থেকে ৩,৪৫০ টাকা/মাস জরিমানা এবং ১২.৫০ টাকা/kWh ট্যারিফ ব্যবহার করে গণনা করা হয়েছে।',
    assumptionsEn: 'Calculated using actual BDT 3,450/mo surcharge and factory tariff of BDT 12.50/kWh.',
    savingsBdtRange: { low: 100000, typical: 120000, high: 140000 },
    capexBdtRange: { low: 35000, typical: 45000, high: 55000 },
    paybackMonthsRange: { low: 3.2, typical: 4.5, high: 6.0 },
    tco2eAvoidedRange: { low: 4.2, typical: 5.5, high: 7.0 },
    costPerTco2e: -18000, // Negative cost: investment yields huge net profits!
    status: 'Suggested',
    financingNoteBn: 'SREDA গ্রিন ফান্ড এবং স্ট্যান্ডার্ড চার্টার্ড এসএমই সাসটেইনেবিলিটি ঋণে ৫.৫% সুদে অর্থায়নযোগ্য।',
    financingNoteEn: 'Eligible for SREDA Green Refinancing Facility at concessionary 5.5% interest.',
  },
  {
    id: 'rec-air-002',
    measureCode: 'AIR-EE-003',
    titleBn: 'কম্প্রেসড এয়ার পাইপলাইন আল্ট্রাসনিক লিক মেরামত',
    titleEn: 'Compressed Air Ultrasonic Leak Sealing & Pressure Tuning',
    category: 'Compressed Air',
    evidenceGrade: 'A',
    sourceCitation: 'GIZ Bangladesh Promotion of Social & Environmental Standards (PSES) Textile Audit Data',
    sourceUrl: 'https://giz.de',
    applicabilityBn: 'কম্প্রেসার মোটর ৩০ কিলোওয়াটের বেশি এবং ৫ বছরের পুরনো পাইপলাইনযুক্ত ইউনিটের জন্য প্রযোজ্য।',
    applicabilityEn: 'Facilities with compressors > 30 kW and air distribution piping > 3 years old.',
    assumptionsBn: 'গড় পাইপলাইন অপচয় ২০% থেকে কমিয়ে ৫%-এ আনার বাস্তব অভিজ্ঞতার ভিত্তিতে প্রাক্কলিত।',
    assumptionsEn: 'Estimated based on reducing typical 20% air leakage down to 5% optimal baseline.',
    savingsBdtRange: { low: 65000, typical: 85000, high: 110000 },
    capexBdtRange: { low: 10000, typical: 15000, high: 22000 },
    paybackMonthsRange: { low: 0.5, typical: 2.1, high: 3.5 },
    tco2eAvoidedRange: { low: 3.0, typical: 4.2, high: 5.8 },
    costPerTco2e: -16500,
    status: 'Planned',
    financingNoteBn: 'স্বল্প ব্যয়ের অভ্যন্তরীণ অপারেশনাল বাজেট থেকে তাৎক্ষণিক সম্পাদনযোগ্য।',
    financingNoteEn: 'Low capex; easily funded through standard factory monthly operational maintenance budget.',
  },
  {
    id: 'rec-boil-003',
    measureCode: 'BOIL-EE-001',
    titleBn: 'বয়লার ব্লো-ডাউন এবং ফ্লু-গ্যাস ইকোনোমাইজার স্থাপন',
    titleEn: 'Boiler Flue Gas Economizer & Blowdown Heat Recovery',
    category: 'Boiler & Steam',
    evidenceGrade: 'A',
    sourceCitation: 'IFC PaCT Resource Efficiency in Bangladesh Textile Sector Report (Case Study #14)',
    sourceUrl: 'https://pact-bangladesh.org',
    applicabilityBn: 'প্রাকৃতিক গ্যাসচালিত ৫ টন/ঘণ্টা বা ততোধিক ক্ষমতার বাষ্প বয়লারের জন্য প্রযোজ্য।',
    applicabilityEn: 'Steam boilers > 3 TPH operating on Titas gas network without existing economizer.',
    assumptionsBn: 'তিতাস গ্যাস বাণিজ্যিক ট্যারিফ ৩০.০০ টাকা/m³ এবং নিষ্কাশিত ফ্লু গ্যাসের তাপমাত্রা ১৬০°C থেকে ১২০°C এ নামিয়ে আনা।',
    assumptionsEn: 'Based on Titas gas tariff of BDT 30.00/m³ and flue gas heat capture from 160°C down to 120°C.',
    savingsBdtRange: { low: 140000, typical: 185000, high: 240000 },
    capexBdtRange: { low: 180000, typical: 220000, high: 270000 },
    paybackMonthsRange: { low: 9.0, typical: 14.2, high: 18.0 },
    tco2eAvoidedRange: { low: 11.0, typical: 15.5, high: 20.0 },
    costPerTco2e: -9800,
    status: 'Suggested',
    financingNoteBn: 'আইডিসিওএল (IDCOL) এনার্জি এফিসিয়েন্সি ঋণ প্যাকেজের আওতায় ৮০% পর্যন্ত ঋণ সহায়তা উপলব্ধ।',
    financingNoteEn: 'Up to 80% capex financing available via IDCOL Energy Efficiency Financing Scheme.',
  },
  {
    id: 'rec-led-004',
    measureCode: 'ELEC-EE-004',
    titleBn: 'হাই-বে এলইডি লাইটিং এবং ফ্লোর মোশন সেন্সর রূপান্তর',
    titleEn: 'High-Bay Industrial LED Retrofit with Floor Motion Sensors',
    category: 'Electricity',
    evidenceGrade: 'A',
    sourceCitation: 'SREDA Industrial Lighting Efficiency Standards & Peer RMG Field Measurements',
    sourceUrl: 'http://sreda.gov.bd',
    applicabilityBn: 'ফ্লোরে এখনও প্রচলিত T8/T5 ফ্লুরোসেন্ট বা হ্যালোজেন টিউবলাইট ব্যবহারকারী কারখানা।',
    applicabilityEn: 'Factory floors utilizing conventional fluorescent or mercury vapor high-bay fixtures.',
    assumptionsBn: 'প্রতিদিন ১৬ ঘণ্টা কর্মকালীন সময় এবং ৪০% বিদ্যুৎ ব্যবহারের সাশ্রয় প্রাক্কলন।',
    assumptionsEn: 'Based on 16 hrs/day shift operations yielding 40% lighting power reduction.',
    savingsBdtRange: { low: 45000, typical: 60000, high: 80000 },
    capexBdtRange: { low: 40000, typical: 55000, high: 70000 },
    paybackMonthsRange: { low: 8.0, typical: 11.0, high: 14.5 },
    tco2eAvoidedRange: { low: 2.5, typical: 3.4, high: 4.5 },
    costPerTco2e: -8500,
    status: 'Suggested',
    financingNoteBn: 'স্থানীয় ভেন্ডরদের কিস্তিভিত্তিক সরবরাহ ব্যবস্থার অধীনে বাস্তবায়নযোগ্য।',
    financingNoteEn: 'Vendor deferred installment payment schemes readily available in Dhaka.',
  },
  {
    id: 'rec-sol-005',
    measureCode: 'SOL-RE-005',
    titleBn: 'ছাদভিত্তিক সৌর বিদ্যুৎ প্রকল্প (Net-Metering Solar PV - 100 kWp)',
    titleEn: 'Rooftop Solar PV Installation under Net-Metering Scheme (100 kWp)',
    category: 'Renewable Solar',
    evidenceGrade: 'B',
    sourceCitation: 'IDCOL Renewable Energy Rooftop Solar Master Plan & BPDB Net Metering Guidelines',
    sourceUrl: 'http://idcol.org',
    applicabilityBn: 'ন্যূনতম ১০,০০০ বর্গফুট কংক্রিট বা শেড ছাদ এলাকা এবং কারখানার মালিকানাধীন ভবনের জন্য।',
    applicabilityEn: 'Industrial premises with at least 10,000 sq ft unshaded roof space under own title.',
    assumptionsBn: '১০,০০০ বর্গফুট ছাদ এলাকা, বাৎসরিক ১৪০,০০০ kWh সৌর বিদ্যুৎ উৎপাদন ও গ্রিড ট্যারিফ ১২.৫০ টাকা।',
    assumptionsEn: '10,000 sq ft roof yielding ~140,000 kWh/yr displacement of peak utility grid electricity.',
    savingsBdtRange: { low: 1400000, typical: 1750000, high: 2100000 },
    capexBdtRange: { low: 6500000, typical: 7500000, high: 8500000 },
    paybackMonthsRange: { low: 44.0, typical: 51.4, high: 60.0 },
    tco2eAvoidedRange: { low: 78.0, typical: 92.0, high: 108.0 },
    costPerTco2e: 4200,
    status: 'Suggested',
    financingNoteBn: 'আইডিসিওএল (IDCOL) হতে ১০ বছরের মেয়াদে ৬% সুদে ৮০% পর্যন্ত দীর্ঘমেয়াদী কনসেশনাল ঋণ।',
    financingNoteEn: 'IDCOL offers 10-year term financing at 6% interest covering up to 80% total capex.',
  },
];

let inMemoryRecommendations = [...mockRecommendationsList];

function mapDtoToRecommendation(dto: any): Recommendation {
  if (dto.titleBn && dto.savingsBdtRange) {
    return dto;
  }

  const capexLow = Number(dto.capexLow ?? dto.capexBdtRange?.low ?? 0);
  const capexHigh = Number(dto.capexHigh ?? dto.capexBdtRange?.high ?? 0);
  const capexTypical = Number(dto.capexBdtRange?.typical ?? (capexLow + capexHigh) / 2);

  const savingsLow = Number(dto.savingsBdtLow ?? dto.savingsBdtRange?.low ?? 0);
  const savingsTypical = Number(dto.savingsBdtTypical ?? dto.savingsBdtRange?.typical ?? 0);
  const savingsHigh = Number(dto.savingsBdtHigh ?? dto.savingsBdtRange?.high ?? 0);

  const tco2eLow = Number(dto.tco2eAvoidedLow ?? dto.tco2eAvoidedRange?.low ?? 0);
  const tco2eTypical = Number(dto.tco2eAvoidedTypical ?? dto.tco2eAvoidedRange?.typical ?? 0);
  const tco2eHigh = Number(dto.tco2eAvoidedHigh ?? dto.tco2eAvoidedRange?.high ?? 0);

  const paybackMonths = Number(dto.paybackYears ?? 0) * 12;

  return {
    id: String(dto.id),
    measureCode: dto.measureCode || '',
    titleBn: dto.nameBn || dto.titleBn || '',
    titleEn: dto.nameEn || dto.titleEn || '',
    category: dto.category || 'Electricity',
    evidenceGrade: (dto.evidenceGrade || 'A') as EvidenceGrade,
    sourceCitation: dto.sourceCitation || '',
    sourceUrl: dto.sourceUrl || '',
    applicabilityBn: dto.explanationBn || dto.applicabilityBn || '',
    applicabilityEn: dto.explanationEn || dto.applicabilityEn || '',
    assumptionsBn: dto.assumptionsBn || '',
    assumptionsEn: dto.assumptionsEn || '',
    savingsBdtRange: {
      low: savingsLow,
      typical: savingsTypical,
      high: savingsHigh,
    },
    capexBdtRange: {
      low: capexLow,
      typical: capexTypical,
      high: capexHigh,
    },
    paybackMonthsRange: dto.paybackMonthsRange ?? {
      low: Math.max(0.1, Number((paybackMonths * 0.8).toFixed(1))),
      typical: Math.max(0.1, Number(paybackMonths.toFixed(1))),
      high: Math.max(0.1, Number((paybackMonths * 1.2).toFixed(1))),
    },
    tco2eAvoidedRange: {
      low: tco2eLow,
      typical: tco2eTypical,
      high: tco2eHigh,
    },
    costPerTco2e: Number(dto.costPerTco2e ?? 0),
    status: (dto.status || 'Suggested') as RecommendationStatus,
    statusReason: dto.statusReason || undefined,
    financingNoteBn: dto.financingNoteBn || '',
    financingNoteEn: dto.financingNoteEn || '',
    realisedSavingBdt: dto.realisedSavingBdt ? Number(dto.realisedSavingBdt) : undefined,
    addressedFlags: dto.addressedFlags || [],
    nextStepEn: dto.nextStepEn || undefined,
    nextStepBn: dto.nextStepBn || undefined,
    aiAdviceEn: dto.aiAdviceEn || undefined,
    aiAdviceBn: dto.aiAdviceBn || undefined,
    aiRoadmapEn: dto.aiRoadmapEn || undefined,
    aiRoadmapBn: dto.aiRoadmapBn || undefined,
    isAiEnriched: Boolean(dto.isAiEnriched),
  };
}

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const payload = await fetchRecommendationsPayload();
  return payload.recommendations;
}

export async function fetchRecommendationsPayload(): Promise<{
  recommendations: Recommendation[];
  baselineData?: any;
  executiveBrief?: string;
}> {
  try {
    const data = await apiFetch<any>('/api/v1/recommendations');
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.all)) {
      rawList = data.all;
    } else if (data && Array.isArray(data.top5)) {
      rawList = data.top5;
    }

    if (rawList.length > 0) {
      return {
        recommendations: rawList.map(mapDtoToRecommendation),
        baselineData: data?.baselineData,
        executiveBrief: data?.executiveBrief,
      };
    }
    return { recommendations: inMemoryRecommendations };
  } catch {
    return { recommendations: inMemoryRecommendations };
  }
}

export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus,
  reason?: string
): Promise<boolean> {
  try {
    await apiFetch(`/api/v1/recommendations/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    });
  } catch {
    // fallback
  }

  inMemoryRecommendations = inMemoryRecommendations.map((r) =>
    r.id === id ? { ...r, status, statusReason: reason } : r
  );
  return true;
}

export async function recalculateRecommendations(): Promise<RecalculateResponse> {
  try {
    return await apiFetch<RecalculateResponse>('/api/v1/recommendations/recalculate', {
      method: 'POST',
    });
  } catch {
    return {
      status: 'Error',
      hasNewDocuments: false,
      newDocCount: 0,
      message: 'Failed to communicate with recalculation server.',
    };
  }
}

export async function askRagRecommendations(
  query: string,
  topK = 4
): Promise<RagAskResponse> {
  return await apiFetch<RagAskResponse>('/api/v1/recommendations/rag/ask', {
    method: 'POST',
    body: JSON.stringify({ query, topK }),
  });
}

export async function fetchRagCorpusSummary(): Promise<RagCorpusSummary | null> {
  try {
    return await apiFetch<RagCorpusSummary>('/api/v1/recommendations/rag/corpus-summary');
  } catch {
    return null;
  }
}

export const DEFAULT_CALIBRATED_BREAKDOWN: DedicatedBreakdownResponse = {
  overallStrategyEn:
    'Comprehensive Energy Transition Plan: By switching grid electricity to a 250 kWp rooftop solar array, capturing boiler flue waste heat, optimizing generator load scheduling, and consolidating transport routes, your facility can reduce annual operational costs by approximately ৳2,873,000 BDT/year while abating 291.6 tCO2e/year in greenhouse gas emissions.',
  overallStrategyBn:
    'সমন্বিত জ্বালানি রূপান্তর কৌশল: কারখানার ছাদে 250 kWp সৌর বিদ্যুৎ স্থাপন, বয়লারের অপচয়কৃত তাপ পুনরুদ্ধার, জেনারেটর লোড শিডিউলিং এবং পরিবহন রুট অপটিমাইজেশনের মাধ্যমে আপনার কারখানা বছরে প্রায় ৳২,৮৭৩,০০০ টাকা সাশ্রয় এবং ২৯১.৬ tCO2e কার্বন নির্গমন হ্রাস করতে সক্ষম।',
  categories: [
    {
      key: 'electricity',
      titleEn: 'Electricity & Solar PV Switch',
      titleBn: 'বিদ্যুৎ ও সৌরশক্তিতে রূপান্তর',
      switchActionEn:
        'Switch grid electricity to a 250 kWp Grid-Tied Rooftop Solar PV system (utilizing 25,000 sq ft roof area) combined with an APFC capacitor bank.',
      switchActionBn:
        'গ্রিড বিদ্যুতের ব্যবহার কমিয়ে কারখানার ২৫,০০০ বর্গফুট ছাদে ২৫০ kWp গ্রিড-টাইড সোলার পিভি প্যানেল এবং এপিএফসি (APFC) ক্যাপাসিটর ব্যাংক স্থাপন করুন।',
      savingsBdt: '৳১,১২৪,৫৫০ – ৳১,৫২১,৪৫০ BDT/yr',
      capexBdt: '৳১১,২৫০,০০০ – ৳১৬,২৫০,০০০ BDT',
      payback: '2.2 years',
      co2Avoided: '209.2 tCO2e/yr',
      keyStepsEn:
        '1. Complete rooftop structural & shading assessment.\n2. Submit bi-directional net-metering application to utility (DESCO/BREB).\n3. Apply for IDCOL 5.5% concessionary green refinancing.\n4. Select Tier-1 monocrystalline panels and European grid-tie inverters.',
      keyStepsBn:
        '১. ছাদের স্ট্রাকচারাল লোড ও শেডিং পরীক্ষা সম্পন্ন করুন।\n২. ইউটিলিটিতে (ডেসকো/বিআরইবি) নেট-মিটারিং আবেদন জমা দিন।\n৩. ইডকল থেকে ৫.৫% সহজ শর্তে গ্রিন রিফাইন্যান্সিং ঋণ গ্রহণ করুন।\n৪. টিয়ার-১ মনোক্রিস্টালাইন সোলার প্যানেল ও ইনভার্টার স্থাপন করুন।',
    },
    {
      key: 'transport',
      titleEn: 'Transport & Fleet Optimization',
      titleBn: 'পরিবহন ও যানবাহন সাশ্রয়',
      switchActionEn:
        'Consolidate factory freight delivery routes, implement telematics-based idle-stop fuel monitoring, and enforce tire/engine preventive maintenance.',
      switchActionBn:
        'কারখানার পণ্য পরিবহন ও স্টাফ বাসের রুট কনসোলিডেশন করুন, আইডলিং রোধে টেলিমেটিক্স ফুয়েল সেন্সর ব্যবহার করুন এবং নিয়মিত ইঞ্জিন টিউনিং নিশ্চিত করুন।',
      savingsBdt: '৳২৫০,০০০ – ৳৫৫০,০০০ BDT/yr',
      capexBdt: '৳৩০,০০০ – ৳৮০,০০০ BDT',
      payback: '0.4 – 0.8 years',
      co2Avoided: '22.5 tCO2e/yr',
      keyStepsEn:
        '1. Audit monthly factory vehicle fuel receipts and mileage logs.\n2. Group supplier raw-material pickups into scheduled bulk delivery windows.\n3. Implement strict GPS-tracked speed limits and zero-idling driver policies.\n4. Plan long-term transition of local delivery shuttles to electric/CNG.',
      keyStepsBn:
        '১. সকল গাড়ির মাসিক জ্বালানি খরচ ও কিলোমিটার লগ বিশ্লেষণ করুন।\n২. কাঁচামাল সংগ্রহ ও শিপমেন্টের ট্রিপ শিডিউলিং একীভূত করুন।\n৩. জিপিএস ট্র্যাকিং ও অযথা ইঞ্জিন চালু রাখার বিরুদ্ধে ড্রাইভারদের প্রশিক্ষণ দিন।\n৪. দীর্ঘমেয়াদে স্থানীয় ট্রান্সপোর্টে ইলেকট্রিক বা সিএনজি যানবাহন রূপান্তর করুন।',
    },
    {
      key: 'diesel',
      titleEn: 'Diesel Fuel & Generator Optimization',
      titleBn: 'ডিজেল ও জেনারেটর সাশ্রয়',
      switchActionEn:
        'Implement automated changeover sequencing and load-factor right-sizing to keep diesel gensets running at peak efficiency (>65% load factor).',
      switchActionBn:
        'জেনারেটরের লোড ফ্যাক্টর ৬৫% এর উপরে নিশ্চিত করতে অটোমেটেড চেঞ্জওভার কন্ট্রোলার এবং গ্রিড-ফার্স্ট শিডিউলিং ব্যবস্থা চালু করুন।',
      savingsBdt: '৳৪০৮,০০০ – ৳৫৫২,০০০ BDT/yr',
      capexBdt: '৳৬০,০০০ – ৳১৪০,০০০ BDT',
      payback: '0.6 years',
      co2Avoided: '11.9 tCO2e/yr',
      keyStepsEn:
        '1. Install synchronizing and automated changeover controller.\n2. Reconfigure genset startup logic to activate only when grid voltage drops below threshold.\n3. Schedule heavy spinning/dyeing equipment runs during off-peak hours.\n4. Perform regular fuel injector cleaning and fuel-flow calibration.',
      keyStepsBn:
        '১. স্বয়ংক্রিয় চেঞ্জওভার ও লোড সিঙ্ক্রোনাইজার স্থাপন করুন।\n২. গ্রিড ভোল্টেজ নির্দিষ্ট সীমার নিচে নামলেই কেবল জেনারেটর চালু হওয়ার ব্যবস্থা করুন।\n৩. ভারী স্পিনিং ও ডাইং মেশিনের শিডিউলিং অফ-পিক সময়ে নির্ধারণ করুন।\n৪. নিয়মিত ফুয়েল ইনজেক্টর পরিষ্কার ও ডিজেল ফ্লো ক্যালিব্রেশন করুন।',
    },
    {
      key: 'gas',
      titleEn: 'Natural Gas & Boiler Heat Recovery',
      titleBn: 'প্রাকৃতিক গ্যাস ও বয়লার এফিশিয়েন্সি',
      switchActionEn:
        'Install a waste heat recovery economizer on boiler flue exhaust, replace failed mechanical steam traps, and insulate unlagged steam distribution lines.',
      switchActionBn:
        'বয়লারের চিমনিতে ওয়েস্ট হিট রিকভারি ইকোনোমাইজার স্থাপন করুন, নষ্ট স্টিম ট্র্যাপ মেরামত করুন এবং স্টিম পাইপলাইনে ইনসুলেশন নিশ্চিত করুন।',
      savingsBdt: '৳৬৯৭,০০০ – ৳৯৪৩,০০০ BDT/yr',
      capexBdt: '৳১৫০,০০০ – ৳৩২০,০০০ BDT',
      payback: '0.7 years',
      co2Avoided: '48.0 tCO2e/yr',
      keyStepsEn:
        '1. Measure flue gas temperature and install flue economizer to preheat boiler feedwater.\n2. Conduct ultrasonic leak detection survey on steam traps and replace failed units.\n3. Insulate bare steam pipe flanges and valve jackets.\n4. Tune air-to-fuel combustion ratio with digital oxygen trim sensors.',
      keyStepsBn:
        '১. ফ্লু গ্যাসের তাপমাত্রা পরিমাপ করে ফিডওয়াটার প্রিহিট করার জন্য ইকোনোমাইজার স্থাপন করুন।\n২. আল্ট্রাসনিক ডিটেক্টর দিয়ে বাষ্প পাইপলাইন অডিট করে নষ্ট স্টিম ট্র্যাপ পরিবর্তন করুন।\n৩. উন্মুক্ত স্টিম ভালভ ও পাইপলাইনে থার্মাল জ্যাকেট ইনসুলেশন নিশ্চিত করুন।\n৪. ডিজিটাল অক্সিজেন ট্রিম সেন্সর দিয়ে বয়লারের কম্বাশন অনুপাত নিখুঁত করুন।',
    },
  ],
};

export async function fetchDedicatedRagBreakdown(): Promise<DedicatedBreakdownResponse> {
  try {
    const res = await apiFetch<DedicatedBreakdownResponse>('/api/v1/recommendations/rag/breakdown');
    if (res && res.categories && res.categories.length > 0) {
      return res;
    }
    return DEFAULT_CALIBRATED_BREAKDOWN;
  } catch {
    return DEFAULT_CALIBRATED_BREAKDOWN;
  }
}


