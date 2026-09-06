import { LibraryPanel } from '~/organisms/LibraryPanel';
import { StatblockPanel } from '~/organisms/StatblockPanel';
import { EncounterPanel } from '~/organisms/EncounterPanel';
import { TrackerTemplate } from '~/templates/TrackerTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

const HomePage = () => (
  <TrackerTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="initiative" />}
    librarySlot={<LibraryPanel />}
    encounterSlot={<EncounterPanel />}
    statblockSlot={<StatblockPanel />}
  />
);

export default HomePage;
