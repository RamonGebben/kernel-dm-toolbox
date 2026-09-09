'use client';

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import styled, { css } from 'styled-components';
import { Button } from '~/atoms/Button';
import { Icon } from '~/atoms/Icon';
import { TextInput } from '~/atoms/TextInput';
import { EmptyState } from '~/atoms/EmptyState';
import { MapRow, type MapRowFolderOption } from '~/molecules/MapRow';

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

export type MapGalleryViewProps = {
  isPending: boolean;
  folders: readonly MapGalleryFolder[];
  unfiledMaps: readonly MapGalleryItem[];
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
};

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

  const folderOptions: MapRowFolderOption[] = folders.map(folder => ({
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
    <Wrapper>
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

      {uploadError && <ErrorText role="alert">{uploadError}</ErrorText>}

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
    </Wrapper>
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
> & { folderOptions: MapRowFolderOption[] };

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
  if (isPending) return <Skeleton role="status" aria-label="Loading maps" />;

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
        <Section>
          {folders.length > 0 && <SectionTitle>Unfiled</SectionTitle>}
          <List>
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
          </List>
        </Section>
      )}
    </Sections>
  );
};

type FolderGroupProps = {
  folder: MapGalleryFolder;
  folderOptions: MapRowFolderOption[];
  activeMapId: MapGalleryViewProps['activeMapId'];
  onLoad: MapGalleryViewProps['onLoad'];
  onRenameFolder: MapGalleryViewProps['onRenameFolder'];
  onDeleteFolder: MapGalleryViewProps['onDeleteFolder'];
  onRenameMap: MapGalleryViewProps['onRenameMap'];
  onMoveMap: MapGalleryViewProps['onMoveMap'];
  onRemoveMap: MapGalleryViewProps['onRemoveMap'];
};

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
    <Section>
      <SectionHeader>
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
        <FolderActions>
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
        </FolderActions>
      </SectionHeader>
      {isExpanded && (
        <List id={listId}>
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
        </List>
      )}
    </Section>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  min-height: 0;
  height: 100%;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.sm};
`;

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const NewFolderForm = styled.form`
  display: flex;
  flex: 1;
  min-width: 12rem;
  gap: ${props => props.theme.space.xs};
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.danger};
`;

const Sections = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  min-height: 0;
  overflow-y: auto;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
`;

const CollapseToggle = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  min-width: 0;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;

  &:hover ${SectionTitle} {
    color: ${props => props.theme.color.textPrimary};
  }
`;

const Chevron = styled.span<{ $isExpanded: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  transition: transform 120ms ease;
  ${props =>
    !props.$isExpanded &&
    css`
      transform: rotate(-90deg);
    `}
`;

const FolderActions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.xs};
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Skeleton = styled.div`
  height: 12rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
