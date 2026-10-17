export type EvidenceGrade = 'A' | 'B' | 'C';
export type RecommendationStatus = 'Suggested' | 'Planned' | 'Done' | 'NotFeasible';

export interface NumberRange {
  low: number;
  typical: number;
  high: number;
}

export interface Recommendation {
  id: string;
  measureCode: string;
  titleBn: string;
  titleEn: string;
  category: string;
  evidenceGrade: EvidenceGrade;
  sourceCitation: string;
  sourceUrl?: string;
  applicabilityBn: string;
  applicabilityEn: string;
  assumptionsBn: string;
  assumptionsEn: string;
  savingsBdtRange: NumberRange;
  capexBdtRange: NumberRange;
  paybackMonthsRange: NumberRange;
  tco2eAvoidedRange: NumberRange;
  costPerTco2e: number; // In BDT / tCO2e. Can be negative!
  status: RecommendationStatus;
  statusReason?: string;
  financingNoteBn: string;
  financingNoteEn: string;
  realisedSavingBdt?: number;
  addressedFlags?: string[];
  aiAdviceEn?: string;
  aiAdviceBn?: string;
  aiRoadmapEn?: string;
  aiRoadmapBn?: string;
  isAiEnriched?: boolean;
}

export interface FacilityBaselineData {
  annualElectricityKwh: number;
  totalElectricityCostBdt: number;
  electricityTariffBdtPerKwh: number;
  annualDieselLitres: number;
  totalDieselCostBdt: number;
  dieselTariffBdtPerLitre: number;
  annualGasM3: number;
  totalGasCostBdt: number;
  gasTariffBdtPerM3: number;
  hasRealBills: boolean;
  billsCount: number;
  activeFlagCodes: string[];
  activeFlagSummaries: string[];
}

export interface RecommendationsPayload {
  recommendations: Recommendation[];
  baselineData?: FacilityBaselineData;
  executiveBrief?: string;
}

export interface RagKnowledgeChunk {
  id: string;
  title: string;
  type: string;
  content: string;
  sourceCitation: string;
  relevanceScore: number;
}

export interface RagAskResponse {
  query: string;
  answer: string;
  model: string;
  retrievedContextCount: number;
  retrievedChunks: RagKnowledgeChunk[];
}

export interface RagCorpusSummary {
  totalChunks: number;
  billChunks: number;
  flagChunks: number;
  measureChunks: number;
  profileChunks: number;
  lastIndexedAtUtc: string;
}

