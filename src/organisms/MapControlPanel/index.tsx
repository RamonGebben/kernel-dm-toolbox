'use client';

import styled, { css } from 'styled-components';
import { Icon, type IconName } from '~/atoms/Icon';
import { useMapToolStore, type MapControlPanelId } from '~/stores/mapTool';
import { MapGalleryPanel } from '~/organisms/MapGalleryPanel';
import { GridControlsPanel } from '~/organisms/GridControlsPanel';
import { FogControlsPanel } from '~/organisms/FogControlsPanel';
import { SessionControlsPanel } from '~/organisms/SessionControlsPanel';
import { PlayerViewLockButton } from '~/organisms/PlayerViewLockButton';

const SECTIONS: readonly {
  id: MapControlPanelId;
  label: string;
  icon: IconName;
}[] = [
  { id: 'gallery', label: 'Maps', icon: 'images' },
  { id: 'grid', label: 'Grid', icon: 'grid' },
  { id: 'fog', label: 'Fog', icon: 'cloud' },
  { id: 'session', label: 'Session', icon: 'cast' },
];

/**
 * The floating icon rail and its collapsible drawer, layered over the
 * full-screen map canvas rather than occupying a permanent side column —
 * `MapsTemplate` positions `CanvasArea` as the `position: relative` anchor
 * both pieces below are absolutely positioned against.
 *
 * Not a connected boundary in the data-fetching sense — it reads only
 * `useMapToolStore`'s ephemeral `activePanel` — so each of the four panels
 * below stays free to be its own independent connected boundary.
 */
export const MapControlPanel = () => {
  const activePanel = useMapToolStore(state => state.activePanel);
  const setActivePanel = useMapToolStore(state => state.setActivePanel);

  const activeSection = SECTIONS.find(section => section.id === activePanel);

  return (
    <>
      <Rail aria-label="Map controls">
        {SECTIONS.map(section => {
          const isActive = section.id === activePanel;
          return (
            <RailButton
              key={section.id}
              type="button"
              $isActive={isActive}
              aria-pressed={isActive}
              aria-label={section.label}
              title={section.label}
              onClick={() => setActivePanel(isActive ? null : section.id)}
            >
              <Icon name={section.icon} size="1.25rem" />
            </RailButton>
          );
        })}
        <RailDivider />
        <PlayerViewLockButton />
      </Rail>

      <Drawer
        $isOpen={activeSection !== undefined}
        aria-hidden={!activeSection}
      >
        {activeSection && (
          <>
            <DrawerHeader>
              <DrawerTitle>{activeSection.label}</DrawerTitle>
              <CloseButton
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Close panel"
              >
                ✕
              </CloseButton>
            </DrawerHeader>
            <DrawerBody>
              {activePanel === 'gallery' && <MapGalleryPanel />}
              {activePanel === 'grid' && <GridControlsPanel />}
              {activePanel === 'fog' && <FogControlsPanel />}
              {activePanel === 'session' && <SessionControlsPanel />}
            </DrawerBody>
          </>
        )}
      </Drawer>
    </>
  );
};

const OVERLAY_SURFACE = css`
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color.surface} 90%, transparent)`};
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.color.border};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const RAIL_WIDTH = '3.5rem';

const Rail = styled.nav`
  position: absolute;
  top: ${props => props.theme.space.md};
  left: ${props => props.theme.space.md};
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  width: ${RAIL_WIDTH};
  padding: ${props => props.theme.space.xs};
  border-radius: ${props => props.theme.radius.lg};
  ${OVERLAY_SURFACE}
`;

const RailButton = styled.button<{ $isActive: boolean }>`
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: ${props => props.theme.radius.md};
  background: transparent;
  color: ${props => props.theme.color.textMuted};
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease,
    border-color 120ms ease;

  &:hover {
    color: ${props => props.theme.color.textPrimary};
    background: ${props => props.theme.color.surfaceRaised};
  }

  ${props =>
    props.$isActive &&
    css`
      color: ${props.theme.color.accent};
      border-color: ${props.theme.color.accentMuted};
      background: ${props.theme.color.surfaceRaised};
    `}
`;

const RailDivider = styled.hr`
  width: 100%;
  margin: ${props => props.theme.space.xs} 0;
  border: none;
  border-top: 1px solid ${props => props.theme.color.border};
`;

const Drawer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: ${props => props.theme.space.md};
  left: calc(${RAIL_WIDTH} + ${props => props.theme.space.md} * 2);
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(
    22rem,
    calc(100% - ${RAIL_WIDTH} - ${props => props.theme.space.md} * 3)
  );
  max-height: calc(100% - ${props => props.theme.space.md} * 2);
  border-radius: ${props => props.theme.radius.lg};
  ${OVERLAY_SURFACE}

  transition:
    opacity 160ms ease,
    transform 160ms ease;

  ${props =>
    props.$isOpen
      ? css`
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        `
      : css`
          opacity: 0;
          transform: translateX(-8px);
          pointer-events: none;
        `}
`;

const DrawerHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  border-bottom: 1px solid ${props => props.theme.color.border};
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize.md};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color.textPrimary};
`;

const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: ${props => props.theme.radius.sm};
  background: transparent;
  color: ${props => props.theme.color.textMuted};
  cursor: pointer;
  font-size: ${props => props.theme.fontSize.sm};

  &:hover {
    color: ${props => props.theme.color.textPrimary};
    background: ${props => props.theme.color.surfaceRaised};
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${props => props.theme.space.md};
`;
