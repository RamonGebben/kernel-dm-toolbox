import { describe, expect, it } from 'vitest';
import { toMapDetail } from '~/server/trpc/helpers/toMapDetail';
import type { MapAsset } from '~/server/db/schema';

const baseMap = {
  id: 'm1',
  name: 'Tavern',
  kind: 'image',
  storagePath: 'abc.png',
} as MapAsset;

describe('toMapDetail', () => {
  it('derives the file URL from the map id, not the storage path', () => {
    expect(toMapDetail(baseMap).fileUrl).toBe('/api/maps/m1/file');
  });

  it('keeps every other field from the row', () => {
    expect(toMapDetail(baseMap)).toMatchObject({ id: 'm1', name: 'Tavern' });
  });
});
