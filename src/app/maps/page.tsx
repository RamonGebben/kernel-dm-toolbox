import { MapCanvas } from '~/organisms/MapCanvas';
import { MapControlPanel } from '~/organisms/MapControlPanel';
import { MapsTemplate } from '~/templates/MapsTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

/**
 * A Server Component. Reads no env and no feature gate, so — unlike the
 * initiative tracker's page — it can prerender.
 */
const MapsPage = () => (
  <MapsTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="maps" />}
    canvasSlot={<MapCanvas />}
    controlsSlot={<MapControlPanel />}
  />
);

export default MapsPage;
