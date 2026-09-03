type WithParent = { readonly [key: string]: unknown };

type PartitionResult<TRow> = {
  /** Rows whose parent exists and can be safely inserted. */
  kept: TRow[];
  /** Rows referencing a parent that was not imported. */
  orphaned: TRow[];
};

/**
 * Splits child rows by whether their parent was actually imported.
 *
 * The fixture files are exported per model, not per document, so a child row
 * can reference a parent outside the set we pulled. Inserting one would fail a
 * foreign key at a point far from the cause, so orphans are separated here and
 * reported by the import instead.
 */
export const partitionByParent = <
  TRow extends WithParent,
  TKey extends keyof TRow,
>(
  rows: readonly TRow[],
  parentKey: TKey,
  knownParents: ReadonlySet<string>,
): PartitionResult<TRow> =>
  rows.reduce<PartitionResult<TRow>>(
    (result, row) => {
      const parent = row[parentKey];
      const isKnown = typeof parent === 'string' && knownParents.has(parent);

      return isKnown
        ? { ...result, kept: [...result.kept, row] }
        : { ...result, orphaned: [...result.orphaned, row] };
    },
    { kept: [], orphaned: [] },
  );
