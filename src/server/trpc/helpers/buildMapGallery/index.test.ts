import { describe, expect, it } from 'vitest';
import { buildMapGallery } from '~/server/trpc/helpers/buildMapGallery';

describe('buildMapGallery', () => {
  it('groups maps under their folder, ordered by the folder sortOrder', () => {
    const gallery = buildMapGallery({
      folders: [
        { id: 'f2', name: 'Dungeons', sortOrder: 1 },
        { id: 'f1', name: 'Towns', sortOrder: 0 },
      ],
      maps: [
        {
          id: 'm1',
          name: 'Crypt',
          kind: 'image',
          folderId: 'f2',
          nativeWidth: null,
          nativeHeight: null,
          gridCellSize: null,
        },
      ],
    });

    expect(gallery.folders.map(folder => folder.id)).toEqual(['f1', 'f2']);
    expect(gallery.folders[1]!.maps).toHaveLength(1);
    expect(gallery.folders[0]!.maps).toHaveLength(0);
  });

  it('puts maps with no folder in unfiledMaps', () => {
    const gallery = buildMapGallery({
      folders: [],
      maps: [
        {
          id: 'm1',
          name: 'Tavern',
          kind: 'image',
          folderId: null,
          nativeWidth: null,
          nativeHeight: null,
          gridCellSize: null,
        },
      ],
    });

    expect(gallery.unfiledMaps).toHaveLength(1);
    expect(gallery.unfiledMaps[0]!.id).toBe('m1');
  });

  it('derives the file URL from the map id, not the storage path', () => {
    const gallery = buildMapGallery({
      folders: [],
      maps: [
        {
          id: 'm1',
          name: 'Tavern',
          kind: 'image',
          folderId: null,
          nativeWidth: null,
          nativeHeight: null,
          gridCellSize: null,
        },
      ],
    });

    expect(gallery.unfiledMaps[0]!.fileUrl).toBe('/api/maps/m1/file');
  });

  it('reports calibration only once gridCellSize is set', () => {
    const gallery = buildMapGallery({
      folders: [],
      maps: [
        {
          id: 'uncalibrated',
          name: 'A',
          kind: 'image',
          folderId: null,
          nativeWidth: null,
          nativeHeight: null,
          gridCellSize: null,
        },
        {
          id: 'calibrated',
          name: 'B',
          kind: 'image',
          folderId: null,
          nativeWidth: null,
          nativeHeight: null,
          gridCellSize: 70,
        },
      ],
    });

    const byId = Object.fromEntries(
      gallery.unfiledMaps.map(map => [map.id, map]),
    );

    expect(byId.uncalibrated!.hasGridCalibration).toBe(false);
    expect(byId.calibrated!.hasGridCalibration).toBe(true);
  });
});
