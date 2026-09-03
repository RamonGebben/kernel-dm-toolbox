import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query';
import superjson from 'superjson';

/**
 * TanStack Query is the only client data layer. This factory is shared by the
 * browser (one long-lived client) and the server (a fresh client per request),
 * so both agree on stale times and on superjson (de)serialisation.
 */
export const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Long enough that a server-prefetched query is not immediately
        // refetched on the client the moment it hydrates.
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        // Also ship still-pending queries so streamed results can hydrate.
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
