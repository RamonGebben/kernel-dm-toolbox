'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Icon } from '~/atoms/Icon';
import { Portal } from '~/atoms/Portal';
import { TextInput } from '~/atoms/TextInput';
import { useDismissableMenu } from '~/hooks/useDismissableMenu';
import { useFloatingPosition } from '~/hooks/useFloatingPosition';

export type MapRowFolderOption = {
  id: string;
  name: string;
};

export type MapRowProps = {
  name: string;
  kind: string;
  hasGridCalibration: boolean;
  folderOptions: readonly MapRowFolderOption[];
  currentFolderId: string | null;
  isLoaded: boolean;
  onLoad: () => void;
  onRename: (name: string) => void;
  onMove: (folderId: string | null) => void;
  onRemove: () => void;
};

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
      <Header>
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
      </Header>
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

type MapRowMenuProps = {
  name: string;
  folderOptions: readonly MapRowFolderOption[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
  onRename: () => void;
  onRemove: () => void;
};

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

const Row = styled.div<{ $isLoaded: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isLoaded ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Name = styled.p`
  margin: 0;
  min-width: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Meta = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.textMuted};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const MenuWrapper = styled.div`
  display: inline-flex;
`;

const MenuTrigger = styled(Button)`
  padding: ${props => props.theme.space.xs};
`;

/** Positioned off-screen until `useFloatingPosition` measures the trigger,
 * so there is nothing to flash before its first real `top`/`left` commits. */
const Menu = styled.div`
  position: fixed;
  top: -9999px;
  left: -9999px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  min-width: 12rem;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const MenuLabel = styled.p`
  margin: 0;
  padding: 0 ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
`;

const MenuDivider = styled.hr`
  width: 100%;
  margin: ${props => props.theme.space.xs} 0;
  border: none;
  border-top: 1px solid ${props => props.theme.color.border};
`;

const MenuItem = styled.button<{ $isDanger?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.radius.sm};
  color: ${props =>
    props.$isDanger ? props.theme.color.danger : props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.color.surface};
  }

  &[aria-pressed='true'] {
    color: ${props => props.theme.color.accent};
    font-weight: 600;
  }
`;
