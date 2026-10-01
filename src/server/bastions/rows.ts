import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  bastionBasicFacilities,
  bastionProjects,
  bastionSpecialFacilities,
  bastions,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { toProjectCompletion } from '~/server/trpc/helpers/planBastionProject';
import { refundToTreasury } from '~/server/party/treasury';

/**
 * Bastion row access shared by the bastions, bastion-turn and character
 * routers: the live-row loaders, finishing a construction project — which the
 * DM can do by hand, and a bastion turn does when the days run out — and
 * giving a bastion up.
 */

export const notFound = (what: string) =>
  new TRPCError({
    code: 'NOT_FOUND',
    message: `That ${what} no longer exists.`,
  });

export const loadBastion = async (db: Database, id: string) => {
  const bastion = await db.query.bastions.findFirst({
    where: and(eq(bastions.id, id), isNull(bastions.deletedAt)),
  });
  if (!bastion) throw notFound('bastion');

  return bastion;
};

export const loadSpecialFacility = async (db: Database, id: string) => {
  const facility = await db.query.bastionSpecialFacilities.findFirst({
    where: and(
      eq(bastionSpecialFacilities.id, id),
      isNull(bastionSpecialFacilities.deletedAt),
    ),
  });
  if (!facility) throw notFound('facility');

  return facility;
};

export const loadBasicFacility = async (db: Database, id: string) => {
  const facility = await db.query.bastionBasicFacilities.findFirst({
    where: and(
      eq(bastionBasicFacilities.id, id),
      isNull(bastionBasicFacilities.deletedAt),
    ),
  });
  if (!facility) throw notFound('facility');

  return facility;
};

/** Applies a finished project's effect and stamps it complete. */
export const completeProject = async (
  db: Database,
  project: typeof bastionProjects.$inferSelect,
) => {
  const now = new Date();
  const completion = toProjectCompletion(project);

  if (completion.type === 'insert-basic') {
    await db.insert(bastionBasicFacilities).values({
      bastionId: project.bastionId,
      type: completion.basicType,
      space: completion.space,
    });
  }

  if (completion.type === 'resize-basic') {
    const facility = await loadBasicFacility(db, completion.facilityId);
    await db
      .update(bastionBasicFacilities)
      .set({
        space: completion.space,
        ...touchSyncMeta({ version: facility.version, now }),
      })
      .where(eq(bastionBasicFacilities.id, facility.id));
  }

  if (completion.type === 'resize-special') {
    const facility = await loadSpecialFacility(db, completion.facilityId);
    await db
      .update(bastionSpecialFacilities)
      .set({
        space: completion.space,
        ...touchSyncMeta({ version: facility.version, now }),
      })
      .where(eq(bastionSpecialFacilities.id, facility.id));
  }

  if (completion.type === 'add-walls') {
    const bastion = await loadBastion(db, project.bastionId);
    await db
      .update(bastions)
      .set({
        wallSquares: bastion.wallSquares + completion.squares,
        ...touchSyncMeta({ version: bastion.version, now }),
      })
      .where(eq(bastions.id, bastion.id));
  }

  await db
    .update(bastionProjects)
    .set({
      daysRemaining: 0,
      completedAt: now,
      ...touchSyncMeta({ version: project.version, now }),
    })
    .where(eq(bastionProjects.id, project.id));
};

/**
 * Gives a bastion up: the bastion is tombstoned, and construction still under
 * way in it is cancelled and its full cost refunded — a turn only advances
 * projects in live bastions, so left open it would never finish and the gold
 * would be gone.
 */
export const abandonBastion = async (
  db: Database,
  bastion: typeof bastions.$inferSelect,
  now: Date,
) => {
  const open = await db
    .select()
    .from(bastionProjects)
    .where(
      and(
        eq(bastionProjects.bastionId, bastion.id),
        isNull(bastionProjects.completedAt),
        isNull(bastionProjects.deletedAt),
      ),
    );

  for (const project of open) {
    await db
      .update(bastionProjects)
      .set(tombstoneSyncMeta({ version: project.version, now }))
      .where(eq(bastionProjects.id, project.id));
    await refundToTreasury(db, project.costGp);
  }

  await db
    .update(bastions)
    .set(tombstoneSyncMeta({ version: bastion.version, now }))
    .where(eq(bastions.id, bastion.id));
};
