import { z } from 'zod';

/** The shape of nearly every "act on one row by id" mutation input across
 * every domain router — a single client-generated UUID. */
export const idInputSchema = z.object({ id: z.uuid() });
