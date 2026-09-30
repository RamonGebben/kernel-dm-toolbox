import { describe, expect, it } from 'vitest';
import { buildCreatureDocumentOptions } from '~/server/trpc/helpers/buildCreatureDocumentOptions';

describe('buildCreatureDocumentOptions', () => {
  it('dedupes and labels known documents by their source title', () => {
    expect(
      buildCreatureDocumentOptions(['srd-2024', 'srd-2024', 'a5e-mm']),
    ).toEqual([
      { value: 'a5e-mm', label: 'Monstrous Menagerie' },
      { value: 'srd-2024', label: 'System Reference Document 5.2' },
    ]);
  });

  it('sorts alphabetically by label, not by value', () => {
    expect(
      buildCreatureDocumentOptions(['tob', 'ccdx', 'srd-2024']).map(
        option => option.value,
      ),
    ).toEqual(['ccdx', 'srd-2024', 'tob']);
  });

  it('falls back to the raw value for an unrecognised document', () => {
    expect(buildCreatureDocumentOptions(['some-future-source'])).toEqual([
      { value: 'some-future-source', label: 'some-future-source' },
    ]);
  });

  it('ignores blank entries', () => {
    expect(buildCreatureDocumentOptions(['', '  ', 'srd-2024'])).toEqual([
      { value: 'srd-2024', label: 'System Reference Document 5.2' },
    ]);
  });

  it('returns an empty list for no input', () => {
    expect(buildCreatureDocumentOptions([])).toEqual([]);
  });
});
