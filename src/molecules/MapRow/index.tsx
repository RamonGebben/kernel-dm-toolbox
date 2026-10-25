'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { Button } from '~/atoms/Button';
import { Icon } from '~/atoms/Icon';
import { Portal } from '~/atoms/Portal';
import { TextInput } from '~/atoms/TextInput';
import { useDismissableMenu } from '~/hooks/useDismissableMenu';
import { useFloatingPosition } from '~/hooks/useFloatingPosition';
import { Row } from '~/molecules/MapRow/components/Row';
import { SpreadRow } from '~/atoms/SpreadRow';
import { Name } from '~/molecules/MapRow/components/Name';
import { Meta } from '~/molecules/MapRow/components/Meta';
import { Footer } from '~/molecules/MapRow/components/Footer';
import { MenuWrapper } from '~/molecules/MapRow/components/MenuWrapper';
import { MenuTrigger } from '~/molecules/MapRow/components/MenuTrigger';
import { Menu } from '~/molecules/MapRow/components/Menu';
import { MenuLabel } from '~/molecules/MapRow/components/MenuLabel';
import { MenuDivider } from '~/molecules/MapRow/components/MenuDivider';
import { MenuItem } from '~/molecules/MapRow/components/MenuItem';

export interface MapRowFolderOption {
  id: string;
  name: string;
}

export interface MapRowProps {
  name: string;
  kind: string;
  hasGridCalibration: boolean;
  folderOptions: ReadonlyArray<MapRowFolderOption>;
  currentFolderId: string | null;
  isLoaded: boolean;
  onLoad: () => void;
  onRename: (name: string) => void;
  onMove: (folderId: string | null) => void;
  onRemove: () => void;
}

/** One map in the gallery: its name (renamable in place), where it lives, and actions. */
export const MapRow = ({
  name,
  kind,
  hasGridCalibration,
  folderOptions,
  currentFolderId,
  isLoaded,
  onLoad,
  onRename,
  onMove,
  onRemove,
}: MapRowProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    setIsEditingName(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitRename();
    if (event.key === 'Escape') {
      setDraftName(name);
      setIsEditingName(false);
    }
  };

  return (
    <Row $isLoaded={isLoaded}>
      <SpreadRow $align="flex-start">
        {isEditingName ? (
          <TextInput
            autoFocus
            value={draftName}
            aria-label="Map name"
            onChange={event => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <Name>{name}</Name>
        )}
        <MapRowMenu
          name={name}
          folderOptions={folderOptions}
          currentFolderId={currentFolderId}
          onMove={onMove}
          onRename={() => setIsEditingName(true)}
          onRemove={onRemove}
        />
      </SpreadRow>
      <Meta>
        {kind === 'video' ? 'Video' : 'Image'} ·{' '}
        {hasGridCalibration ? 'Grid calibrated' : 'No grid calibration'}
      </Meta>
      <Footer>
        <Button
          variant={isLoaded ? 'primary' : 'secondary'}
          size="sm"
          onClick={onLoad}
          aria-pressed={isLoaded}
          aria-label={isLoaded ? `${name} is loaded` : `Load ${name}`}
        >
          {isLoaded ? 'Loaded' : 'Load map'}
        </Button>
      </Footer>
    </Row>
  );
};

interface MapRowMenuProps {
  name: string;
  folderOptions: ReadonlyArray<MapRowFolderOption>;
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
  onRename: () => void;
  onRemove: () => void;
}

/**
 * The kebab menu: move to folder, rename, and remove, collapsed behind one
 * trigger. The menu itself renders through `Portal`, positioned against the
 * trigger by `useFloatingPosition` — see `FilterBar` for why a
 * `position: absolute` child stopped being safe once this sat inside a
 * scrolling gallery.
 */
const MapRowMenu = ({
  name,
  folderOptions,
  currentFolderId,
  onMove,
  onRename,
  onRemove,
}: MapRowMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const { triggerRef, menuRef } = useDismissableMenu(isOpen, () =>
    setIsOpen(false),
  );
  const position = useFloatingPosition(isOpen, triggerRef, menuRef, 'end');

  return (
    <MenuWrapper ref={triggerRef}>
      <MenuTrigger
        type="button"
        variant="ghost"
        size="sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`More actions for ${name}`}
        onClick={() => setIsOpen(current => !current)}
      >
        <Icon name="more" size="1.25rem" />
      </MenuTrigger>
      {isOpen && (
        <Portal>
          <Menu
            ref={menuRef}
            id={menuId}
            role="group"
            aria-label={`Actions for ${name}`}
            style={
              position
                ? { top: `${position.top}px`, left: `${position.left}px` }
                : undefined
            }
          >
            <MenuLabel>Move to folder</MenuLabel>
            <MenuItem
              type="button"
              aria-pressed={currentFolderId === null}
              onClick={() => {
                onMove(null);
                setIsOpen(false);
              }}
            >
              No folder
            </MenuItem>
            {folderOptions.map(folder => (
              <MenuItem
                key={folder.id}
                type="button"
                aria-pressed={currentFolderId === folder.id}
                onClick={() => {
                  onMove(folder.id);
                  setIsOpen(false);
                }}
              >
                {folder.name}
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem
              type="button"
              onClick={() => {
                onRename();
                setIsOpen(false);
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              type="button"
              $isDanger
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
            >
              Remove
            </MenuItem>
          </Menu>
        </Portal>
      )}
    </MenuWrapper>
  );
};
