'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { TRPCContextProvider } from '~/trpc/react';
import { makeQueryClient } from '~/trpc/query-client';
import { env } from '~/env';
import type { AppRouter } from '~/server/trpc/routers/_app';

let browserQueryClient: QueryClient | undefined;

/**
 * The server needs a fresh client per request so that one render's cache never
 * leaks into another. The browser needs exactly one for the life of the tab, or
 * React would discard the cache on every suspense-driven re-render.
 */
const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};

/**
 * Relative on the client so the request follows whatever host the page was
 * served from — which matters when the instance is reached by LAN IP rather
 * than localhost.
 */
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') return '/api/trpc';

  const origin = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${origin}/api/trpc`;
};

type TRPCProviderProps = {
  children: ReactNode;
};

export const TRPCProvider = ({ children }: TRPCProviderProps) => {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getApiUrl(), transformer: superjson })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCContextProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCContextProvider>
    </QueryClientProvider>
  );
};
