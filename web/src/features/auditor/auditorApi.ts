import { AuditorSnapshot, AuditorLineItem } from './types';
import { apiFetch } from '../../lib/apiClient';

export const mockAuditorSnapshot: AuditorSnapshot = {
  reportId: 'rep-2026-08',
  period: '2026-08',
  organizationName: 'Apex Textiles Limited',
  facilityLocation: 'Kashimpur, Gazipur, Dhaka Division, Bangladesh',
  contentHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  lockedAt: '2026-09-05T14:30:00Z',
  approvedBy: 'Kabir Ahmed (Managing Director)',
  totalEmissions: 63.30,
  scope1Emissions: 14.10,
  scope2Emissions: 44.50,
  scope3Emissions: 4.70,
  dataQualityScore: 0.8950,
  dqsGrade: 'Grade A',
  redactPrices: true,
  token: 'share-tok-inditex-202608',
  lineItems: [
    {
      id: 'audit-item-01',
      scope: 'Scope 1',
      sourceNameBn: 'ব্যাকআপ জেনারেটর ১ (ক্যাটারপিলার ৫০০ kVA)',
      sourceNameEn: 'Backup Generator 1 (Caterpillar 500 kVA)',
      activityQuantity: 2850,
      activityUnit: 'Litres',
      billedAmountBdt: 313500.0,
      emissionsTco2e: 7.64,
      documentId: 'DOC-DSL-202608-01',
      documentTypeBn: 'পদ্মা অয়েল কোম্পানি জ্বালানি চালান',
      documentTypeEn: 'Padma Oil Co. Diesel Slip',
      documentDate: '2026-08-14',
      ocrConfidence: 96.8,
      confirmedBy: 'Rahim Mia (Accounts Clerk)',
      confirmedAt: '2026-08-15T09:12:00Z',
      factorSource: 'IPCC Guidelines for National GHG Inventories (Diesel Stationary Combustion)',
      factorValue: 2.68,
      factorCitationYear: 2024,
    },
    {
      id: 'audit-item-02',
      scope: 'Scope 1',
      sourceNameBn: 'শিল্প বাষ্প বয়লার (তিতাস গ্যাস সংযোগ)',
      sourceNameEn: 'Steam Boiler Unit 1 (Titas Gas Pipeline)',
      activityQuantity: 3200,
      activityUnit: 'm³',
      billedAmountBdt: 96000.0,
      emissionsTco2e: 6.46,
      documentId: 'DOC-GAS-202608-88',
      documentTypeBn: 'তিতাস গ্যাস ট্রান্সমিশন বাণিজ্যিক বিল',
      documentTypeEn: 'Titas Gas Transmission Bill',
      documentDate: '2026-08-28',
      ocrConfidence: 94.2,
      confirmedBy: 'Rahim Mia (Accounts Clerk)',
      confirmedAt: '2026-08-29T11:45:00Z',
      factorSource: 'Department of Environment (DoE) Bangladesh / IPCC Natural Gas EF',
      factorValue: 2.0187,
      factorCitationYear: 2023,
    },
    {
      id: 'audit-item-03',
      scope: 'Scope 2',
      sourceNameBn: 'ডেসকো (DESCO) গ্রিড বিদ্যুৎ সাবস্টেশন সংযোগ',
      sourceNameEn: 'DESCO 11kV Grid Electricity Substation Connection',
      activityQuantity: 69500,
      activityUnit: 'kWh',
      billedAmountBdt: 868750.0,
      emissionsTco2e: 44.50,
      documentId: 'DOC-DESCO-202608-4102',
      documentTypeBn: 'ডেসকো মাসিক শিল্প বিদ্যুৎ বিল',
      documentTypeEn: 'DESCO Industrial Tariff Bill',
      documentDate: '2026-08-31',
      ocrConfidence: 99.1,
      confirmedBy: 'Nusrat Jahan (Compliance Officer)',
      confirmedAt: '2026-09-02T16:20:00Z',
      factorSource: 'SREDA / DoE Bangladesh National Grid Emission Factor (Location-Based)',
      factorValue: 0.640288,
      factorCitationYear: 2025,
    },
    {
      id: 'audit-item-04',
      scope: 'Scope 3',
      sourceNameBn: 'চট্টগ্রাম বন্দর তৈরি পোশাক রপ্তানি পরিবহন চালান',
      sourceNameEn: 'Chittagong Port Garment Export Freight Trucking',
      activityQuantity: 18500,
      activityUnit: 'tonne-km',
      billedAmountBdt: 125000.0,
      emissionsTco2e: 4.70,
      documentId: 'DOC-CHL-202608-904',
      documentTypeBn: 'কন্টেইনার ফ্রেইট ফরওয়ার্ডিং চালান',
      documentTypeEn: 'Export Container Trucking Challan',
      documentDate: '2026-08-25',
      ocrConfidence: 89.5,
      confirmedBy: 'Rahim Mia (Accounts Clerk)',
      confirmedAt: '2026-08-27T10:15:00Z',
      factorSource: 'UK DEFRA / GLEC Framework Freight Transport Factor (Heavy Goods Vehicle)',
      factorValue: 0.254054,
      factorCitationYear: 2024,
    },
  ],
};

export async function fetchAuditorSnapshot(reportId?: string, token?: string): Promise<AuditorSnapshot> {
  try {
    const url = token
      ? `/api/v1/reports/share/${encodeURIComponent(token)}`
      : `/api/v1/reports/${encodeURIComponent(reportId || 'rep-2026-08')}/auditor/trace`;
    const res = await apiFetch<AuditorSnapshot>(url);
    if (res && res.lineItems) return res;
    return mockAuditorSnapshot;
  } catch {
    return mockAuditorSnapshot;
  }
}
