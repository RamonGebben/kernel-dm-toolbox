import 'server-only';

import { eq } from 'drizzle-orm';
import { CURRENT_PARTY_ID, parties } from '~/server/db/schema';
import type { Database } from '~/server/db';

/**
 * The party row, created on first read — the same lazy singleton as
 * `ensureEncounter`, so a fresh volume needs no seeding step.
 */
export const ensureParty = async (db: Database) => {
  const existing = await db.query.parties.findFirst({
    where: eq(parties.id, CURRENT_PARTY_ID),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(parties)
    .values({ id: CURRENT_PARTY_ID })
    .onConflictDoNothing()
    .returning();

  // A concurrent request may have won the insert; either way there is a row.
  return (
    created ??
    (await db.query.parties.findFirst({
      where: eq(parties.id, CURRENT_PARTY_ID),
    }))!
  );
};
