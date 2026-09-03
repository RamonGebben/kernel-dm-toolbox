import { CreatureLibrary } from '~/organisms/CreatureLibrary';
import { StatblockPanel } from '~/organisms/StatblockPanel';
import { TrackerTemplate } from '~/templates/TrackerTemplate';
import { LibraryAttribution } from '~/molecules/LibraryAttribution';
import { LIBRARY_ATTRIBUTION } from '~/server/library/source';
import { env } from '~/env';

/**
 * Rendered per request, never prerendered.
 *
 * Configuration reaches this app as environment variables supplied by the
 * container, and the image is built once with `SKIP_ENV_VALIDATION=1`. A
 * prerendered page would bake the build-time defaults into the HTML and ignore
 * whatever the campaign's container was actually started with. Any route that
 * reads `env` or a feature gate must opt out of static rendering the same way.
 */
export const dynamic = 'force-dynamic';

/**
 * A Server Component. Pages are where data is fetched and feature gates are
 * evaluated; the result is handed to a template as plain props.
 */
const HomePage = () => (
  <TrackerTemplate
    campaignName={env.CAMPAIGN_NAME}
    librarySlot={<CreatureLibrary />}
    encounterSlot={<EncounterPlaceholder />}
    statblockSlot={<StatblockPanel />}
    attribution={<LibraryAttribution {...LIBRARY_ATTRIBUTION} />}
  />
);

/** Replaced by the real combatant list in milestone 4. */
const EncounterPlaceholder = () => <p>No combatants yet.</p>;

export default HomePage;
