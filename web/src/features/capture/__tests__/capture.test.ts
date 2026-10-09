import { describe, it, expect } from 'vitest';
import { generateClientGuid } from '../imageProcessing';

describe('Floor Capture Feature Tests', () => {
  it('generateClientGuid creates valid UUID v4 formatted strings', () => {
    const guid1 = generateClientGuid();
    const guid2 = generateClientGuid();

    expect(guid1).toBeDefined();
    expect(guid2).toBeDefined();
    expect(guid1).not.toBe(guid2);

    // Matches standard UUID pattern 8-4-4-4-12
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(guid1)).toBe(true);
    expect(uuidRegex.test(guid2)).toBe(true);
  });

  it('generates distinct idempotency keys across consecutive captures', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) {
      keys.add(generateClientGuid());
    }
    expect(keys.size).toBe(50);
  });
});
