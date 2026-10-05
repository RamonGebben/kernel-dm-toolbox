import { LibraryPanel } from '~/organisms/LibraryPanel';
import { StatblockPanel } from '~/organisms/StatblockPanel';
import { EncounterPanel } from '~/organisms/EncounterPanel';
import { TrackerTemplate } from '~/templates/TrackerTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

// The library-import status and the encounter's live state change over a
// container's lifetime independently of any build-time snapshot (the library
// import in particular finishes asynchronously after boot). A static shell
// would freeze whatever that state happened to be during `next build` and
// serve it to every request, racing the client's own live query — exactly
// the hydration mismatch this route hit. Mirrors `/player`.
export const dynamic = 'force-dynamic';

const HomePage = () => (
  <TrackerTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="initiative" />}
    librarySlot={<LibraryPanel />}
    encounterSlot={<EncounterPanel />}
    statblockSlot={<StatblockPanel />}
  />
);

export default HomePage;
