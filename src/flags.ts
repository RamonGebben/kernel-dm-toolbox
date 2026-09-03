import 'server-only';

import { env } from '~/env';

/**
 * Feature gates.
 *
 * A gate is a server-only environment variable plus a named helper here — not a
 * flags SDK. Helpers are evaluated **server-side** in a page or route handler
 * and the result is passed down as a plain boolean prop; Client Components
 * never call these.
 *
 * The `server-only` import above turns a client import into a build error.
 * Flipping a gate requires a restart of the container — accepted, given one
 * deployment per campaign.
 */

/** Gates the initiative tracker, the first planned feature. */
export const isInitiativeTrackerEnabled = (): boolean =>
  env.FEATURE_INITIATIVE_TRACKER === 'true';
