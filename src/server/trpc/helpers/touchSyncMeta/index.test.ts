import { describe, expect, it } from 'vitest';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';

const now = new Date('2026-01-01T12:00:00.000Z');

describe('touchSyncMeta', () => {
  it('bumps the version so a conflicting write is detectable', () => {
    expect(touchSyncMeta({ version: 3, now }).version).toBe(4);
  });

  it('stamps the time last-write-wins is resolved by', () => {
    expect(touchSyncMeta({ version: 1, now }).updatedAt).toEqual(now);
  });

  it('defaults the writer to this device', () => {
    expect(touchSyncMeta({ version: 1, now }).updatedBy).toBe('local');
  });

  it('records a different writer when one is given', () => {
    expect(
      touchSyncMeta({ version: 1, now, updatedBy: 'tablet' }).updatedBy,
    ).toBe('tablet');
  });
});

describe('tombstoneSyncMeta', () => {
  it('sets the tombstone rather than implying a hard delete', () => {
    expect(tombstoneSyncMeta({ version: 1, now }).deletedAt).toEqual(now);
  });

  it('still bumps the version, because deleting is a write', () => {
    expect(tombstoneSyncMeta({ version: 1, now }).version).toBe(2);
  });
});
