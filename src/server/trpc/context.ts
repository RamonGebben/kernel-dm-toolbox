import 'server-only';

import { env } from '~/env';
import { getDb, type Database } from '~/server/db';

/**
 * Per-request context handed to every tRPC resolver.
 *
 * There is no authentication: one container serves one campaign on a trusted
 * local network (see DECISIONS.md #2). `campaignName` is read from context
 * rather than from `env` directly at each call site, so campaign identity has
 * a single seam — the one an auth or multi-campaign model would slot into.
 */
export type Context = {
  headers: Headers;
  campaignName: string;
  db: Database;
};

type CreateContextOptions = {
  headers: Headers;
};

export const createContext = async ({
  headers,
}: CreateContextOptions): Promise<Context> => ({
  headers,
  campaignName: env.CAMPAIGN_NAME,
  db: getDb(),
});
