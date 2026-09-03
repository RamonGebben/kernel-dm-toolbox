import { z } from 'zod';

/**
 * Every procedure input is a named zod schema living beside its domain, never
 * an inline `z.object({...})` in the router. Schemas are the contract, and are
 * importable by tests and by the client.
 */
export const pingInputSchema = z.object({
  /** Echoed back by the server, so a round trip is observable end to end. */
  message: z.string().min(1).max(120).default('ping'),
});

export type PingInput = z.infer<typeof pingInputSchema>;

export const pingResultSchema = z.object({
  message: z.string(),
  campaignName: z.string(),
  checkedAt: z.date(),
});

export type PingResult = z.infer<typeof pingResultSchema>;
