'use client';

import { createTRPCContext } from '@trpc/tanstack-react-query';
// Type-only: `AppRouter` carries the API shape across the boundary without
// pulling a single line of server code into the browser bundle.
import type { AppRouter } from '~/server/trpc/routers/_app';

/**
 * The client-side access point for the API.
 *
 * Components call `useTRPC()` and pass the resulting options object to a
 * TanStack Query hook:
 *
 * ```tsx
 * const trpc = useTRPC();
 * const { data, isPending } = useQuery(trpc.health.ping.queryOptions({}));
 * ```
 */
export const {
  TRPCProvider: TRPCContextProvider,
  useTRPC,
  useTRPCClient,
} = createTRPCContext<AppRouter>();
