'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { MapGalleryView } from '~/organisms/MapGalleryPanel/components/MapGalleryView';
import { useMapGallery } from '~/organisms/MapGalleryPanel/hooks/useMapGallery';

/**
 * Connected boundary: owns the gallery query, its mutations, and the upload
 * request, and delegates every pixel to `MapGalleryView`, which is where the
 * stories live.
 *
 * Which map is live comes from `trpc.maps.getSession` — picking a map here
 * sets the table's live map directly, there is no separate DM-only preview.
 */
export const MapGalleryPanel = () => {
  const trpc = useTRPC();
  const gallery = useMapGallery();
  const session = useQuery(trpc.maps.getSession.queryOptions());

  return (
    <MapGalleryView
      isPending={gallery.isPending}
      folders={gallery.folders}
      unfiledMaps={gallery.unfiledMaps}
      isUploading={gallery.isUploading}
      uploadError={gallery.uploadError}
      activeMapId={session.data?.activeMapId ?? null}
      onLoad={gallery.onSetActiveMap}
      onUpload={gallery.onUpload}
      onCreateFolder={gallery.onCreateFolder}
      onRenameFolder={gallery.onRenameFolder}
      onDeleteFolder={gallery.onDeleteFolder}
      onRenameMap={gallery.onRenameMap}
      onMoveMap={gallery.onMoveMap}
      onRemoveMap={gallery.onRemoveMap}
    />
  );
};
