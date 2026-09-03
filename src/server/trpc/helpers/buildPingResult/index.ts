import type { PingInput, PingResult } from '~/server/trpc/schemas/health';

type BuildPingResultArgs = {
  input: PingInput;
  campaignName: string;
  now: Date;
};

/**
 * The resolver's actual logic, as a pure function: no I/O, no tRPC types, no
 * clock of its own. That is the whole point of `src/server/trpc/helpers/` —
 * resolvers stay thin adapters and the logic is unit-testable without a server.
 */
export const buildPingResult = ({
  input,
  campaignName,
  now,
}: BuildPingResultArgs): PingResult => ({
  message: input.message,
  campaignName,
  checkedAt: now,
});
