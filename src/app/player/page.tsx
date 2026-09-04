import { PlayerBoard } from '~/organisms/PlayerBoard';

/**
 * The second screen: a read-only initiative order for the table to watch.
 *
 * Nothing here reads `env` or a gate, but the page is still dynamic because
 * its whole purpose is live state — a prerendered shell would be pointless.
 */
export const dynamic = 'force-dynamic';

const PlayerPage = () => <PlayerBoard />;

export default PlayerPage;
