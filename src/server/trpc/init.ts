import 'server-only';

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from '~/server/trpc/context';

/**
 * The **only** `initTRPC` call in the codebase. Everything else imports the
 * router and procedure builders from here — a second call would create a second
 * incompatible tRPC instance.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      // Surfaces which input field failed rather than a generic 400.
      zodError:
        error.cause instanceof ZodError ? z4FlattenedIssues(error.cause) : null,
    },
  }),
});

const z4FlattenedIssues = (error: ZodError) =>
  error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * The base procedure. This app has a single tier because it has no accounts and
 * no login; when auth arrives, add `protectedProcedure` here as a middleware on
 * top of this one rather than guarding inside resolvers.
 */
export const publicProcedure = t.procedure;
