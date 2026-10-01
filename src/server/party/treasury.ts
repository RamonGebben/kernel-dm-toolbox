import 'server-only';

import { and, eq, gte, sql } from 'drizzle-orm';
import { CURRENT_PARTY_ID, parties } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { ensureParty } from '~/server/party/state';

/**
 * Takes `amount` gold from the party treasury if — and only if — it holds
 * that much, in one guarded `UPDATE`. Returns the new balance, or null when
 * the treasury is short and nothing was taken.
 *
 * One statement rather than read-check-write, so two purchases racing each
 * other cannot both pass the check; and not a `transaction()`, which in
 * libsql hands its connection over — on an in-memory database that leaves
 * every later query talking to a fresh, empty one.
 */
export const spendFromTreasury = async (
  db: Database,
  amount: number,
): Promise<number | null> => {
  await ensureParty(db);

  const [updated] = await db
    .update(parties)
    .set({
      treasuryGold: sql`${parties.treasuryGold} - ${amount}`,
      version: sql`${parties.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(parties.id, CURRENT_PARTY_ID), gte(parties.treasuryGold, amount)),
    )
    .returning({ treasuryGold: parties.treasuryGold });

  return updated?.treasuryGold ?? null;
};

/** Puts gold back — a cancelled project, or a spend whose write then failed. */
export const refundToTreasury = async (
  db: Database,
  amount: number,
): Promise<void> => {
  await ensureParty(db);

  await db
    .update(parties)
    .set({
      treasuryGold: sql`${parties.treasuryGold} + ${amount}`,
      version: sql`${parties.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(parties.id, CURRENT_PARTY_ID));
};
