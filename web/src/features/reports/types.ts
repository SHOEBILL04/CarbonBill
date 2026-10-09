export type ReportStatus = 'Draft' | 'ReadyForReview' | 'Approved' | 'Locked' | 'Superseded';

export interface ReportReadinessData {
  allExpectedDocsReceived: boolean;
  missingDocsCount: number;
  criticalFlagsResolved: boolean;
  openCriticalFlagsCount: number;
  dqsAboveThreshold: boolean;
  dqsScore: number;
  factorsUpToDate: boolean;
  isReadyForApproval: boolean;
}

export interface ShareLinkInfo {
  token: string;
  shareUrl: string;
  expiresAt: string;
  redactPrices: boolean;
  viewCount: number;
}

export interface ReportItem {
  id: string;
  period: string;
  status: ReportStatus;
  version: number;
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  totalEmissions: number;
  dataQualityScore: number;
  dqsGrade: string;
  contentHashSha256?: string;
  approvedBy?: string;
  approvedAt?: string;
  readinessChecklist: ReportReadinessData;
  activeShareLinks: ShareLinkInfo[];
}
