import { ConnectionStatus } from '~/organisms/ConnectionStatus';
import { DashboardTemplate } from '~/templates/DashboardTemplate';
import { isInitiativeTrackerEnabled } from '~/flags';
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
  <DashboardTemplate
    campaignName={env.CAMPAIGN_NAME}
    isInitiativeTrackerEnabled={isInitiativeTrackerEnabled()}
    statusSlot={<ConnectionStatus />}
  />
);

export default HomePage;
