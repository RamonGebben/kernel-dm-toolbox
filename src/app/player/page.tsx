import { PlayerScreen } from '~/organisms/PlayerScreen';

/**
 * The second screen: a read-only view of the map, the initiative order, or
 * both, switched by the live session's `playerScreenMode`.
 *
 * Nothing here reads `env` or a gate, but the page is still dynamic because
 * its whole purpose is live state — a prerendered shell would be pointless.
 */
export const dynamic = 'force-dynamic';

const PlayerPage = () => <PlayerScreen />;

export default PlayerPage;
