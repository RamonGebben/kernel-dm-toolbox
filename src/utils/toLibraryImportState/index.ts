export type LibraryImportStatus = { isImported: boolean } | undefined;

export type LibraryImportState = {
  isPending: boolean;
  isLibraryImported: boolean;
};

/**
 * The "is this library usable yet" derivation shared by every Open5e-backed
 * library screen (creatures, spells): pending while either its status or its
 * list query is still loading, and imported only once the status query says
 * so — an unknown status defaults to not-imported, the safer state.
 */
export const toLibraryImportState = ({
  isStatusPending,
  isListPending,
  status,
}: {
  isStatusPending: boolean;
  isListPending: boolean;
  status: LibraryImportStatus;
}): LibraryImportState => ({
  isPending: isStatusPending || isListPending,
  isLibraryImported: status?.isImported ?? false,
});
