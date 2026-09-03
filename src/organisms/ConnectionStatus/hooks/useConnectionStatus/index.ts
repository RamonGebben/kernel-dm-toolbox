'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import type { PingResult } from '~/server/trpc/schemas/health';

/**
 * A discriminated union rather than a bag of booleans, so an impossible state
 * (pending *and* connected) cannot be represented at all.
 */
export type ConnectionStatus =
  | { state: 'pending' }
  | { state: 'error'; reason: string }
  | {
      state: 'connected';
      message: string;
      campaignName: string;
      checkedAt: Date;
    };

type ToConnectionStatusArgs = {
  isPending: boolean;
  error: { message: string } | null;
  data: PingResult | undefined;
};

/**
 * The hook's entire decision logic, exported as a pure function so the
 * browser-free `unit` project can test it without a React renderer.
 *
 * Note the order: pending is checked **first**, and `isPending` is used rather
 * than `isLoading` (which reads `false` during a persisted-cache restore).
 */
export const toConnectionStatus = ({
  isPending,
  error,
  data,
}: ToConnectionStatusArgs): ConnectionStatus => {
  if (isPending) return { state: 'pending' };
  if (error) return { state: 'error', reason: error.message };
  if (!data)
    return { state: 'error', reason: 'The server returned no result.' };

  return {
    state: 'connected',
    message: data.message,
    campaignName: data.campaignName,
    checkedAt: data.checkedAt,
  };
};

/**
 * A thin wrapper: it wires the query and hands the result straight to the pure
 * helper above. Component hooks should stay this small.
 */
export const useConnectionStatus = (): ConnectionStatus => {
  const trpc = useTRPC();
  const { isPending, error, data } = useQuery(
    trpc.health.ping.queryOptions({ message: 'ping' }),
  );

  return toConnectionStatus({ isPending, error, data });
};
