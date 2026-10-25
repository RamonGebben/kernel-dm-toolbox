'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import {
  toLibraryImportState,
  type LibraryImportStatus,
} from '~/utils/toLibraryImportState';
import type { CheckboxListOption } from '~/atoms/CheckboxList';
import { experienceByChallengeRating } from '~/content/challengeRating';
import { formatChallengeRating } from '~/utils/formatChallengeRating';
import type {
  ChallengeRatingRange,
  CreatureSource,
  CreatureSummary,
} from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

export interface CreatureLibraryState {
  isPending: boolean;
  isLibraryImported: boolean;
  creatures: Array<CreatureSummary>;
  search: string;
  setSearch: (search: string) => void;
  sourceOptions: Array<CheckboxListOption>;
  selectedSources: Array<string>;
  setSelectedSources: (sources: Array<string>) => void;
  typeOptions: Array<CheckboxListOption>;
  selectedTypes: Array<string>;
  setSelectedTypes: (types: Array<string>) => void;
  documentOptions: Array<CheckboxListOption>;
  selectedDocuments: Array<string>;
  setSelectedDocuments: (documents: Array<string>) => void;
  challengeRatingOptions: Array<ChallengeRatingOption>;
  challengeRatingRange: ChallengeRatingRange;
  setMinChallengeRating: (min: number | null) => void;
  setMaxChallengeRating: (max: number | null) => void;
}

export interface ChallengeRatingOption {
  value: number;
  label: string;
}

/**
 * Every challenge rating the rules define, ascending. Fixed rather than
 * derived from the imported rows: the XP table is already the complete list,
 * and a range bound doesn't need a creature to exist at exactly that CR.
 */
export const CHALLENGE_RATING_OPTIONS: Array<ChallengeRatingOption> =
  Object.keys(experienceByChallengeRating)
    .map(Number)
    .toSorted((a, b) => a - b)
    .map(value => ({ value, label: formatChallengeRating(value) }));

/**
 * Setting a minimum above the current maximum drags the maximum up with it,
 * so the range can never invert into a query that matches nothing.
 */
export const withMinChallengeRating = (
  range: ChallengeRatingRange,
  min: number | null,
): ChallengeRatingRange => ({
  min,
  max: min != null && range.max != null && range.max < min ? min : range.max,
});

/** The mirror of `withMinChallengeRating`: a lower maximum drags the minimum down. */
export const withMaxChallengeRating = (
  range: ChallengeRatingRange,
  max: number | null,
): ChallengeRatingRange => ({
  min: max != null && range.min != null && range.min > max ? max : range.min,
  max,
});

/**
 * Fixed rather than derived: unlike creature type, "where did this row come
 * from" is exactly two values by construction, not something the data can
 * grow a third option for.
 */
export const SOURCE_FILTER_OPTIONS: Array<CheckboxListOption> = [
  { value: 'library', label: 'Library' },
  { value: 'custom', label: 'Custom' },
];

/**
 * The multi-select's selection as a pure function of the source filter, so
 * the browser-free unit project can test it. Mirrors the level/class filters'
 * convention: no boxes checked means "any" — checking neither and checking
 * both are the same query.
 */
export const toCreatureSourceInput = (
  selectedSources: ReadonlyArray<string>,
): CreatureSource => {
  const hasLibrary = selectedSources.includes('library');
  const hasCustom = selectedSources.includes('custom');

  if (hasLibrary && !hasCustom) return 'library';
  if (hasCustom && !hasLibrary) return 'custom';
  return 'all';
};

/**
 * The Book/document filter has no meaning once narrowed to custom creatures
 * only — the server drops any non-empty `documents` for `source: 'custom'`
 * (mirroring `category`, see library.ts's `listCreatures`). Pure so this
 * "keep the query honest regardless of whether the UI remembered to clear
 * the selection" rule is testable without a React renderer, the same
 * pattern `toCreatureSourceInput` already follows for a sibling decision.
 */
export const toDocumentsFilterInput = (
  source: CreatureSource,
  selectedDocuments: ReadonlyArray<string>,
): Array<string> => (source === 'custom' ? [] : [...selectedDocuments]);

interface ToLibraryStateArgs {
  isStatusPending: boolean;
  isListPending: boolean;
  status: LibraryImportStatus;
  creatures: Array<CreatureSummary> | undefined;
}

/**
 * The hook's decision logic as a pure function, so the browser-free unit
 * project can test it.
 *
 * The subtlety worth testing: an empty result means two different things
 * depending on whether the library was ever imported, and the view renders a
 * different empty state for each.
 */
export const toLibraryState = ({
  isStatusPending,
  isListPending,
  status,
  creatures,
}: ToLibraryStateArgs): Omit<
  CreatureLibraryState,
  | 'search'
  | 'setSearch'
  | 'sourceOptions'
  | 'selectedSources'
  | 'setSelectedSources'
  | 'typeOptions'
  | 'selectedTypes'
  | 'setSelectedTypes'
  | 'documentOptions'
  | 'selectedDocuments'
  | 'setSelectedDocuments'
  | 'challengeRatingOptions'
  | 'challengeRatingRange'
  | 'setMinChallengeRating'
  | 'setMaxChallengeRating'
> => ({
  ...toLibraryImportState({ isStatusPending, isListPending, status }),
  creatures: creatures ?? [],
});

/** Builds the union input `encounter.addCreature` expects from either source. */
export const toAddCreatureInput = (
  creature: CreatureSummary,
):
  | { source: 'library'; slug: string; count: number }
  | { source: 'custom'; id: string; count: number } =>
  creature.source === 'library'
    ? { source: 'library', slug: creature.slug, count: 1 }
    : { source: 'custom', id: creature.id, count: 1 };

export const useCreatureLibrary = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedSources, setSelectedSources] = useState<Array<string>>([]);
  const [selectedTypes, setSelectedTypes] = useState<Array<string>>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Array<string>>([]);
  const [challengeRatingRange, setChallengeRatingRange] =
    useState<ChallengeRatingRange>({ min: null, max: null });

  const status = useQuery(trpc.library.status.queryOptions());
  const types = useQuery(trpc.library.listCreatureTypes.queryOptions());
  const documents = useQuery(trpc.library.listCreatureDocuments.queryOptions());
  const source = toCreatureSourceInput(selectedSources);
  // The Book control is only *disabled* while narrowed to Custom, not
  // cleared, so a selection made before narrowing would otherwise still be
  // sent — `toDocumentsFilterInput` is what keeps the query honest.
  const list = useQuery(
    trpc.library.listCreatures.queryOptions({
      search,
      source,
      types: selectedTypes,
      documents: toDocumentsFilterInput(source, selectedDocuments),
      minChallengeRating: challengeRatingRange.min ?? undefined,
      maxChallengeRating: challengeRatingRange.max ?? undefined,
    }),
  );

  const addCreature = useMutation(
    trpc.encounter.addCreature.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.encounter.get.queryKey(),
        }),
    }),
  );

  return {
    ...toLibraryState({
      isStatusPending: status.isPending,
      isListPending: list.isPending,
      status: status.data,
      creatures: list.data,
    }),
    search,
    setSearch,
    sourceOptions: SOURCE_FILTER_OPTIONS,
    selectedSources,
    setSelectedSources,
    typeOptions: types.data ?? [],
    selectedTypes,
    setSelectedTypes,
    documentOptions: documents.data ?? [],
    selectedDocuments,
    setSelectedDocuments,
    challengeRatingOptions: CHALLENGE_RATING_OPTIONS,
    challengeRatingRange,
    setMinChallengeRating: (min: number | null) =>
      setChallengeRatingRange(range => withMinChallengeRating(range, min)),
    setMaxChallengeRating: (max: number | null) =>
      setChallengeRatingRange(range => withMaxChallengeRating(range, max)),
    addCreature: (creature: CreatureSummary) =>
      addCreature.mutate(toAddCreatureInput(creature)),
  };
};
