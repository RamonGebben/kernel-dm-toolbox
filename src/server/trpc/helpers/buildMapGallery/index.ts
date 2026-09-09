/**
 * Pure shaping of the raw folder/map rows into what the gallery panel
 * renders: folders with their contained maps, and the maps left unfiled.
 */

export type MapGalleryItem = {
  id: string;
  name: string;
  kind: string;
  folderId: string | null;
  fileUrl: string;
  nativeWidth: number | null;
  nativeHeight: number | null;
  hasGridCalibration: boolean;
};

export type MapGalleryFolder = {
  id: string;
  name: string;
  sortOrder: number;
  maps: MapGalleryItem[];
};

export type MapGallery = {
  folders: MapGalleryFolder[];
  unfiledMaps: MapGalleryItem[];
};

type FolderRow = { id: string; name: string; sortOrder: number };

type MapRow = {
  id: string;
  name: string;
  kind: string;
  folderId: string | null;
  nativeWidth: number | null;
  nativeHeight: number | null;
  gridCellSize: number | null;
};

const toGalleryItem = (map: MapRow): MapGalleryItem => ({
  id: map.id,
  name: map.name,
  kind: map.kind,
  folderId: map.folderId,
  fileUrl: `/api/maps/${map.id}/file`,
  nativeWidth: map.nativeWidth,
  nativeHeight: map.nativeHeight,
  hasGridCalibration: map.gridCellSize !== null,
});

export const buildMapGallery = ({
  folders,
  maps,
}: {
  folders: FolderRow[];
  maps: MapRow[];
}): MapGallery => {
  const sortedFolders = [...folders].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return {
    folders: sortedFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      sortOrder: folder.sortOrder,
      maps: maps.filter(map => map.folderId === folder.id).map(toGalleryItem),
    })),
    unfiledMaps: maps.filter(map => map.folderId === null).map(toGalleryItem),
  };
};
