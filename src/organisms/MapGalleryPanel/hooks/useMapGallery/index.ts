'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';

export type MapGalleryItem = {
  id: string;
  name: string;
  kind: string;
  fileUrl: string;
  hasGridCalibration: boolean;
};

export type MapGalleryFolder = {
  id: string;
  name: string;
  maps: MapGalleryItem[];
};

type RawGallery =
  | { folders: MapGalleryFolder[]; unfiledMaps: MapGalleryItem[] }
  | undefined;

/**
 * Defaults an unfetched/pending gallery to empty, so `undefined` never
 * reaches a `.map()` further down.
 */
export const toMapGalleryViewState = (gallery: RawGallery) => ({
  folders: gallery?.folders ?? [],
  unfiledMaps: gallery?.unfiledMaps ?? [],
});

export const useMapGallery = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const list = useQuery(trpc.maps.list.queryOptions());

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.maps.list.queryKey() });

  const createFolder = useMutation(
    trpc.maps.createFolder.mutationOptions({ onSuccess: invalidate }),
  );
  const renameFolder = useMutation(
    trpc.maps.renameFolder.mutationOptions({ onSuccess: invalidate }),
  );
  const deleteFolder = useMutation(
    trpc.maps.deleteFolder.mutationOptions({ onSuccess: invalidate }),
  );
  const renameMap = useMutation(
    trpc.maps.rename.mutationOptions({ onSuccess: invalidate }),
  );
  const moveMap = useMutation(
    trpc.maps.move.mutationOptions({ onSuccess: invalidate }),
  );
  const removeMap = useMutation(
    trpc.maps.remove.mutationOptions({ onSuccess: invalidate }),
  );
  const setActiveMap = useMutation(
    trpc.maps.setActiveMap.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.maps.getSession.queryKey(),
        }),
    }),
  );

  /**
   * Upload lives outside tRPC — no multipart support — so this is a plain
   * `fetch`. The insert on the server IS the confirmation; invalidating the
   * list here is this hook's equivalent of a mutation's `onSuccess`.
   */
  const upload = async (file: File, folderId: string | null) => {
    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.set('file', file);
    if (folderId) formData.set('folderId', folderId);

    try {
      const response = await fetch('/api/maps/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setUploadError(body?.error ?? 'Could not upload that file.');
        return;
      }

      await invalidate();
    } catch {
      setUploadError('Could not reach the server.');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isPending: list.isPending,
    ...toMapGalleryViewState(list.data),
    isUploading,
    uploadError,
    onUpload: upload,
    onCreateFolder: (name: string) => createFolder.mutate({ name }),
    onRenameFolder: (id: string, name: string) =>
      renameFolder.mutate({ id, name }),
    onDeleteFolder: (id: string) => deleteFolder.mutate({ id }),
    onRenameMap: (id: string, name: string) => renameMap.mutate({ id, name }),
    onMoveMap: (id: string, folderId: string | null) =>
      moveMap.mutate({ id, folderId }),
    onRemoveMap: (id: string) => removeMap.mutate({ id }),
    onSetActiveMap: (id: string) => setActiveMap.mutate({ mapId: id }),
  };
};
