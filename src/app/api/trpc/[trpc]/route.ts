import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/server/trpc/routers/_app';
import { createContext } from '~/server/trpc/context';

/**
 * The single HTTP entry point for the whole API. Both GET (queries) and POST
 * (mutations) are served here; there are no other route handlers.
 */
const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext({ headers: request.headers }),
  });

export { handler as GET, handler as POST };
