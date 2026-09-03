/**
 * The write half of the `syncMeta` contract.
 *
 * Every update bumps `version` and `updatedAt`, because last-write-wins by
 * `updatedAt` is only meaningful if every writer actually sets it. Doing this
 * by hand at each call site is how a row eventually stops being reconcilable.
 */
export const touchSyncMeta = ({
  version,
  now,
  updatedBy = 'local',
}: {
  version: number;
  now: Date;
  updatedBy?: string;
}) => ({
  updatedAt: now,
  version: version + 1,
  updatedBy,
});

/**
 * A soft delete: the tombstone, never a `DELETE`. Reads filter on
 * `deletedAt is null`.
 */
export const tombstoneSyncMeta = ({
  version,
  now,
  updatedBy = 'local',
}: {
  version: number;
  now: Date;
  updatedBy?: string;
}) => ({
  ...touchSyncMeta({ version, now, updatedBy }),
  deletedAt: now,
});
