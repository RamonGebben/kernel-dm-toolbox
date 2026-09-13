import { describe, expect, it } from 'vitest';
import { toLibraryImportState } from '~/utils/toLibraryImportState';

describe('toLibraryImportState', () => {
  it('is pending while either query is still pending', () => {
    expect(
      toLibraryImportState({
        isStatusPending: true,
        isListPending: false,
        status: undefined,
      }).isPending,
    ).toBe(true);

    expect(
      toLibraryImportState({
        isStatusPending: false,
        isListPending: true,
        status: { isImported: true },
      }).isPending,
    ).toBe(true);
  });

  it('treats an unknown status as not imported, so the safer state wins', () => {
    expect(
      toLibraryImportState({
        isStatusPending: false,
        isListPending: false,
        status: undefined,
      }).isLibraryImported,
    ).toBe(false);
  });

  it('reflects the status query once it resolves', () => {
    expect(
      toLibraryImportState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
      }).isLibraryImported,
    ).toBe(true);
  });
});
