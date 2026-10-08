'use client';

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Button } from '~/atoms/Button';
import { Icon } from '~/atoms/Icon';
import { TextInput } from '~/atoms/TextInput';
import { EmptyState } from '~/atoms/EmptyState';
import { MapRow, type MapRowFolderOption } from '~/molecules/MapRow';
import { FillStack } from '~/atoms/FillStack';
import { Toolbar } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/Toolbar';
import { HiddenFileInput } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/HiddenFileInput';
import { NewFolderForm } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/NewFolderForm';
import { ErrorNote } from '~/atoms/ErrorNote';
import { Sections } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/Sections';
import { Stack } from '~/atoms/Stack';
import { SpreadRow } from '~/atoms/SpreadRow';
import { SectionTitle } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/SectionTitle';
import { CollapseToggle } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/CollapseToggle';
import { Chevron } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/Chevron';
import { Cluster } from '~/atoms/Cluster';
import { PlainList } from '~/atoms/PlainList';
import { Skeleton } from '~/atoms/Skeleton';

export interface MapGalleryItem {
  id: string;
  name: string;
  kind: string;
  fileUrl: string;
  hasGridCalibration: boolean;
}

export interface MapGalleryFolder {
  id: string;
  name: string;
  maps: Array<MapGalleryItem>;
}

export interface MapGalleryViewProps {
  isPending: boolean;
  folders: ReadonlyArray<MapGalleryFolder>;
  unfiledMaps: ReadonlyArray<MapGalleryItem>;
  isUploading: boolean;
  uploadError: string | null;
  /** Which map is live on the table right now — null once none is loaded. */
  activeMapId: string | null;
  onLoad: (id: string) => void;
  onUpload: (file: File, folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameMap: (id: string, name: string) => void;
  onMoveMap: (id: string, folderId: string | null) => void;
  onRemoveMap: (id: string) => void;
}

const MAP_FILE_ACCEPT = '.png,.jpg,.jpeg,.webp,.webm';

/**
 * The map gallery: upload, folders, and every uploaded map. Presentational —
 * every state is reachable from a story because nothing here fetches.
 */
export const MapGalleryView = ({
  isPending,
  folders,
  unfiledMaps,
  isUploading,
  uploadError,
  activeMapId,
  onLoad,
  onUpload,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameMap,
  onMoveMap,
  onRemoveMap,
}: MapGalleryViewProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const folderOptions: Array<MapRowFolderOption> = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
  }));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onUpload(file, null);
  };

  const handleCreateFolder = (event: FormEvent) => {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;

    onCreateFolder(name);
    setNewFolderName('');
  };

  return (
    <FillStack>
      <Toolbar>
        <Button
          variant="secondary"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? 'Uploading…' : 'Upload map'}
        </Button>
        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept={MAP_FILE_ACCEPT}
          aria-label="Upload a map file"
          onChange={handleFileChange}
        />
        <NewFolderForm onSubmit={handleCreateFolder}>
          <TextInput
            value={newFolderName}
            placeholder="New folder…"
            aria-label="New folder name"
            onChange={event => setNewFolderName(event.target.value)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!newFolderName.trim()}
          >
            Add
          </Button>
        </NewFolderForm>
      </Toolbar>

      {uploadError && <ErrorNote role="alert">{uploadError}</ErrorNote>}

      <GalleryBody
        isPending={isPending}
        folders={folders}
        unfiledMaps={unfiledMaps}
        folderOptions={folderOptions}
        activeMapId={activeMapId}
        onLoad={onLoad}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onRenameMap={onRenameMap}
        onMoveMap={onMoveMap}
        onRemoveMap={onRemoveMap}
      />
    </FillStack>
  );
};

type GalleryBodyProps = Pick<
  MapGalleryViewProps,
  | 'isPending'
  | 'folders'
  | 'unfiledMaps'
  | 'activeMapId'
  | 'onLoad'
  | 'onRenameFolder'
  | 'onDeleteFolder'
  | 'onRenameMap'
  | 'onMoveMap'
  | 'onRemoveMap'
> & { folderOptions: Array<MapRowFolderOption> };

/** A real named subcomponent, so the loading/empty/loaded states stay guard clauses. */
const GalleryBody = ({
  isPending,
  folders,
  unfiledMaps,
  folderOptions,
  activeMapId,
  onLoad,
  onRenameFolder,
  onDeleteFolder,
  onRenameMap,
  onMoveMap,
  onRemoveMap,
}: GalleryBodyProps) => {
  if (isPending) return <Skeleton $height="12rem" aria-label="Loading maps" />;

  if (!folders.length && !unfiledMaps.length) {
    return (
      <EmptyState
        title="No maps yet"
        description="Upload a battle map to get started."
      />
    );
  }

  return (
    <Sections>
      {folders.map(folder => (
        <FolderGroup
          key={folder.id}
          folder={folder}
          folderOptions={folderOptions}
          activeMapId={activeMapId}
          onLoad={onLoad}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onRenameMap={onRenameMap}
          onMoveMap={onMoveMap}
          onRemoveMap={onRemoveMap}
        />
      ))}

      {unfiledMaps.length > 0 && (
        <Stack $gap="s">
          {folders.length > 0 && <SectionTitle>Unfiled</SectionTitle>}
          <PlainList>
            {unfiledMaps.map(map => (
              <li key={map.id}>
                <MapRow
                  name={map.name}
                  kind={map.kind}
                  hasGridCalibration={map.hasGridCalibration}
                  folderOptions={folderOptions}
                  currentFolderId={null}
                  isLoaded={map.id === activeMapId}
                  onLoad={() => onLoad(map.id)}
                  onRename={name => onRenameMap(map.id, name)}
                  onMove={folderId => onMoveMap(map.id, folderId)}
                  onRemove={() => onRemoveMap(map.id)}
                />
              </li>
            ))}
          </PlainList>
        </Stack>
      )}
    </Sections>
  );
};

interface FolderGroupProps {
  folder: MapGalleryFolder;
  folderOptions: Array<MapRowFolderOption>;
  activeMapId: MapGalleryViewProps['activeMapId'];
  onLoad: MapGalleryViewProps['onLoad'];
  onRenameFolder: MapGalleryViewProps['onRenameFolder'];
  onDeleteFolder: MapGalleryViewProps['onDeleteFolder'];
  onRenameMap: MapGalleryViewProps['onRenameMap'];
  onMoveMap: MapGalleryViewProps['onMoveMap'];
  onRemoveMap: MapGalleryViewProps['onRemoveMap'];
}

const FolderGroup = ({
  folder,
  folderOptions,
  activeMapId,
  onLoad,
  onRenameFolder,
  onDeleteFolder,
  onRenameMap,
  onMoveMap,
  onRemoveMap,
}: FolderGroupProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);
  const [isExpanded, setIsExpanded] = useState(true);
  const listId = useId();

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== folder.name) onRenameFolder(folder.id, trimmed);
    setIsEditingName(false);
  };

  return (
    <Stack $gap="s">
      <SpreadRow>
        {isEditingName ? (
          <TextInput
            autoFocus
            value={draftName}
            aria-label="Folder name"
            onChange={event => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={event => {
              if (event.key === 'Enter') commitRename();
              if (event.key === 'Escape') {
                setDraftName(folder.name);
                setIsEditingName(false);
              }
            }}
          />
        ) : (
          <CollapseToggle
            type="button"
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={() => setIsExpanded(current => !current)}
          >
            <Chevron $isExpanded={isExpanded}>
              <Icon name="chevronDown" size="1rem" />
            </Chevron>
            <SectionTitle>
              {folder.name} ({folder.maps.length})
            </SectionTitle>
          </CollapseToggle>
        )}
        <Cluster $gap="xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingName(true)}
          >
            Rename
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteFolder(folder.id)}
            aria-label={`Delete folder ${folder.name}`}
          >
            Delete
          </Button>
        </Cluster>
      </SpreadRow>
      {isExpanded && (
        <PlainList id={listId}>
          {folder.maps.map(map => (
            <li key={map.id}>
              <MapRow
                name={map.name}
                kind={map.kind}
                hasGridCalibration={map.hasGridCalibration}
                folderOptions={folderOptions}
                currentFolderId={folder.id}
                isLoaded={map.id === activeMapId}
                onLoad={() => onLoad(map.id)}
                onRename={name => onRenameMap(map.id, name)}
                onMove={folderId => onMoveMap(map.id, folderId)}
                onRemove={() => onRemoveMap(map.id)}
              />
            </li>
          ))}
        </PlainList>
      )}
    </Stack>
  );
};
