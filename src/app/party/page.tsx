import { Suspense } from 'react';
import { PartyRoster } from '~/organisms/PartyRoster';
import { PartyTreasury } from '~/organisms/PartyTreasury';
import { PartyTemplate } from '~/templates/PartyTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

/**
 * A Server Component. The roster reads `?edit=` through `useSearchParams`,
 * so it sits in a `Suspense` boundary — the route is dynamic anyway (the root
 * layout reads `env`), but the boundary keeps it correct if that ever changes.
 */
const PartyPage = () => (
  <PartyTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="party" />}
    rosterSlot={
      <Suspense>
        <PartyRoster />
      </Suspense>
    }
    treasurySlot={<PartyTreasury />}
  />
);

export default PartyPage;
