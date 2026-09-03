import 'server-only';

import { env } from '~/env';

/**
 * Per-request context handed to every tRPC resolver.
 *
 * There is no authentication: one container serves one campaign on a trusted
 * local network (see DECISIONS.md). The `campaignName` field exists so that
 * resolvers already read campaign identity from context rather than from env
 * directly — the seam an auth or multi-campaign model would slot into later.
 */
export type Context = {
  headers: Headers;
  campaignName: string;
};

type CreateContextOptions = {
  headers: Headers;
};

export const createContext = async ({
  headers,
}: CreateContextOptions): Promise<Context> => ({
  headers,
  campaignName: env.CAMPAIGN_NAME,
});
