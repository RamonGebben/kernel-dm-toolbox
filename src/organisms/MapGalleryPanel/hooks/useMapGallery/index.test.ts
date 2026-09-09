import { describe, expect, it } from 'vitest';
import { toMapGalleryViewState } from '~/organisms/MapGalleryPanel/hooks/useMapGallery';

describe('toMapGalleryViewState', () => {
  it('defaults to an empty gallery while the query is pending', () => {
    expect(toMapGalleryViewState(undefined)).toEqual({
      folders: [],
      unfiledMaps: [],
    });
  });

  it('passes an already-loaded gallery through unchanged', () => {
    const gallery = {
      folders: [{ id: 'f1', name: 'Dungeons', maps: [] }],
      unfiledMaps: [
        {
          id: 'm1',
          name: 'Tavern',
          kind: 'image',
          fileUrl: '/api/maps/m1/file',
          hasGridCalibration: false,
        },
      ],
    };

    expect(toMapGalleryViewState(gallery)).toEqual(gallery);
  });
});
