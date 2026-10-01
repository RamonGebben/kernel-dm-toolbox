import 'server-only';

import { and, eq, gte, sql } from 'drizzle-orm';
import { CURRENT_PARTY_ID, parties } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { ensureParty } from '~/server/party/state';

/**
 * Moves `delta` gold in or out of the party treasury if — and only if — the
 * balance stays at or above zero, in one guarded, relative `UPDATE`. Returns
 * the new balance, or null when the treasury is short and nothing changed.
 *
 * One statement rather than read-check-write, so two changes racing each
 * other cannot both pass the check, nor can one overwrite the other's result;
 * and not a `transaction()`, which in libsql hands its connection over — on an
 * in-memory database that leaves every later query talking to a fresh, empty
 * one.
 */
export const changeTreasury = async (
  db: Database,
  delta: number,
): Promise<number | null> => {
  await ensureParty(db);

  const [updated] = await db
    .update(parties)
    .set({
      treasuryGold: sql`${parties.treasuryGold} + ${delta}`,
      version: sql`${parties.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(parties.id, CURRENT_PARTY_ID), gte(parties.treasuryGold, -delta)),
    )
    .returning({ treasuryGold: parties.treasuryGold });

  return updated?.treasuryGold ?? null;
};

/** Takes `amount` gold; null when the treasury is short and nothing was taken. */
export const spendFromTreasury = (
  db: Database,
  amount: number,
): Promise<number | null> => changeTreasury(db, -amount);

/** Puts gold back — a cancelled project, or a spend whose write then failed. */
export const refundToTreasury = async (
  db: Database,
  amount: number,
): Promise<void> => {
  await changeTreasury(db, amount);
};
