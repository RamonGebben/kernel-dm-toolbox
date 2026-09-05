import { SpellLibrary } from '~/organisms/SpellLibrary';
import { SpellDetailPanel } from '~/organisms/SpellDetailPanel';
import { SpellsTemplate } from '~/templates/SpellsTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

/**
 * A Server Component. Reads no env and no feature gate, so — unlike the
 * initiative tracker's page — it can prerender.
 */
const SpellsPage = () => (
  <SpellsTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="spells" />}
    librarySlot={<SpellLibrary />}
    detailSlot={<SpellDetailPanel />}
  />
);

export default SpellsPage;
