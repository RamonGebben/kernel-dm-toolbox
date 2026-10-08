'use client';

import { Icon, type IconName } from '~/atoms/Icon';
import { useMapToolStore, type MapControlPanelId } from '~/store/mapTool';
import { MapGalleryPanel } from '~/organisms/MapGalleryPanel';
import { GridControlsPanel } from '~/organisms/GridControlsPanel';
import { FogControlsPanel } from '~/organisms/FogControlsPanel';
import { SessionControlsPanel } from '~/organisms/SessionControlsPanel';
import { MeasurementControlsPanel } from '~/organisms/MeasurementControlsPanel';
import { PlayerViewLockButton } from '~/organisms/PlayerViewLockButton';
import { Rail } from '~/organisms/MapControlPanel/components/Rail';
import { IconButton } from '~/atoms/IconButton';
import { RailDivider } from '~/organisms/MapControlPanel/components/RailDivider';
import { Drawer } from '~/organisms/MapControlPanel/components/Drawer';
import { DrawerHeader } from '~/organisms/MapControlPanel/components/DrawerHeader';
import { DrawerTitle } from '~/organisms/MapControlPanel/components/DrawerTitle';
import { CloseButton } from '~/organisms/MapControlPanel/components/CloseButton';
import { DrawerBody } from '~/organisms/MapControlPanel/components/DrawerBody';

const SECTIONS: ReadonlyArray<{
  id: MapControlPanelId;
  label: string;
  icon: IconName;
}> = [
  { id: 'gallery', label: 'Maps', icon: 'images' },
  { id: 'grid', label: 'Grid', icon: 'grid' },
  { id: 'fog', label: 'Fog', icon: 'cloud' },
  { id: 'measure', label: 'Measure', icon: 'ruler' },
  { id: 'session', label: 'Player Screen', icon: 'cast' },
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
            <IconButton
              key={section.id}
              type="button"
              $isActive={isActive}
              aria-pressed={isActive}
              aria-label={section.label}
              title={section.label}
              onClick={() => setActivePanel(isActive ? null : section.id)}
            >
              <Icon name={section.icon} size="1.25rem" />
            </IconButton>
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
              {activePanel === 'measure' && <MeasurementControlsPanel />}
              {activePanel === 'session' && <SessionControlsPanel />}
            </DrawerBody>
          </>
        )}
      </Drawer>
    </>
  );
};
