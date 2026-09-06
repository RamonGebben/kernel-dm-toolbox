import { describe, expect, it } from 'vitest';
import { stripDocumentPrefix } from '~/utils/stripDocumentPrefix';

describe('stripDocumentPrefix', () => {
  it('strips a single-segment document prefix', () => {
    expect(stripDocumentPrefix('srd-2024_wizard')).toBe('wizard');
  });

  it('strips a multi-segment document prefix', () => {
    expect(stripDocumentPrefix('srd-2024_evocation')).toBe('evocation');
  });

  it('leaves a slug with no prefix untouched', () => {
    expect(stripDocumentPrefix('wizard')).toBe('wizard');
  });
});
