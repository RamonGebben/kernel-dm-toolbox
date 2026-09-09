import 'server-only';

import { eq } from 'drizzle-orm';
import { CURRENT_MAP_SESSION_ID, mapSessions } from '~/server/db/schema';
import type { Database } from '~/server/db';

/**
 * There is one map session and it always exists — the maps-domain twin of
 * `ensureEncounter`. Creating it lazily on first read means no seed step and
 * no "session not found" branch anywhere.
 */
export const ensureMapSession = async (db: Database) => {
  const existing = await db.query.mapSessions.findFirst({
    where: eq(mapSessions.id, CURRENT_MAP_SESSION_ID),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(mapSessions)
    .values({ id: CURRENT_MAP_SESSION_ID })
    .onConflictDoNothing()
    .returning();

  // A concurrent request may have won the insert; either way there is a row.
  return (
    created ??
    (await db.query.mapSessions.findFirst({
      where: eq(mapSessions.id, CURRENT_MAP_SESSION_ID),
    }))!
  );
};
