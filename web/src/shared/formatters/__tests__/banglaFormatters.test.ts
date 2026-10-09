import { describe, it, expect } from 'vitest';
import {
  toBanglaDigits,
  toLatinDigits,
  formatBdt,
  formatBanglaDate,
  BANGLA_MONTHS
} from '../banglaFormatters';

describe('Bangla & BDT Formatters Unit Tests', () => {
  it('correctly converts Latin digits to Bangla digits', () => {
    expect(toBanglaDigits(1234567890)).toBe('১২৩৪৫৬৭৮৯০');
    expect(toBanglaDigits('123.45')).toBe('১২৩.৪৫');
    expect(toBanglaDigits(0)).toBe('০');
  });

  it('correctly normalizes Bangla digits to Latin digits', () => {
    expect(toLatinDigits('১২৩৪৫৬৭৮৯০')).toBe('1234567890');
    expect(toLatinDigits('১২৩.৪৫')).toBe('123.45');
    expect(toLatinDigits('ডিজেল ১৫০ লিটার')).toBe('ডিজেল 150 লিটার');
  });

  it('formats BDT currency with South Asian comma grouping and Bangla digits', () => {
    expect(formatBdt(1000)).toBe('৳ ১,০০০.০০');
    expect(formatBdt(100000)).toBe('৳ ১,০০,০০০.০০');
    expect(formatBdt(15234567.89)).toBe('৳ ১,৫২,৩৪,৫৬৭.৮৯');
  });

  it('formats BDT currency with Latin digits when requested', () => {
    expect(formatBdt(50000, { useBanglaDigits: false })).toBe('৳ 50,000.00');
    expect(formatBdt(1250000, { useBanglaDigits: false, symbol: 'BDT' })).toBe('BDT 12,50,000.00');
  });

  it('formats dates with localized Bangla Gregorian month names', () => {
    const testDate = new Date(2026, 9, 8); // October 8, 2026
    const formatted = formatBanglaDate(testDate);
    expect(formatted).toBe('০৮ অক্টোবর ২০২৬');
    expect(BANGLA_MONTHS[0]).toBe('জানুয়ারি');
    expect(BANGLA_MONTHS[11]).toBe('ডিসেম্বর');
  });
});
