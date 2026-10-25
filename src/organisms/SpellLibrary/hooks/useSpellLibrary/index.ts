'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { formatSpellLevel } from '~/utils/formatSpellLevel';
import { slugToTitle } from '~/utils/slugToTitle';
import { stripDocumentPrefix } from '~/utils/stripDocumentPrefix';
import {
  toLibraryImportState,
  type LibraryImportStatus,
} from '~/utils/toLibraryImportState';
import type { CheckboxListOption } from '~/atoms/CheckboxList';
import type { SpellSummary } from '~/organisms/SpellLibrary/components/SpellLibraryView';

interface RawSpellSummary {
  slug: string;
  name: string;
  level: number;
  school: string;
}

interface RawSpellClassOption {
  slug: string;
  label: string;
}

export interface SpellLibraryState {
  isPending: boolean;
  isLibraryImported: boolean;
  spells: Array<SpellSummary>;
  search: string;
  setSearch: (search: string) => void;
  levelOptions: Array<CheckboxListOption>;
  selectedLevels: Array<string>;
  setSelectedLevels: (levels: Array<string>) => void;
  classOptions: Array<CheckboxListOption>;
  selectedClassSlugs: Array<string>;
  setSelectedClassSlugs: (classSlugs: Array<string>) => void;
}

/**
 * Every spell level a filter can offer, `0` a cantrip — fixed by the ruleset,
 * so unlike the class list it needs no round trip to build.
 */
export const SPELL_LEVEL_OPTIONS: Array<CheckboxListOption> = Array.from(
  { length: 10 },
  (_, level) => ({ value: String(level), label: formatSpellLevel(level) }),
);

/** The strip-and-title-case a spell's school slug shares with `buildSpellDetail`. */
const schoolLabel = (school: string): string =>
  slugToTitle(stripDocumentPrefix(school));

interface ToSpellLibraryStateArgs {
  isStatusPending: boolean;
  isListPending: boolean;
  status: LibraryImportStatus;
  spells: Array<RawSpellSummary> | undefined;
  classOptions: Array<RawSpellClassOption> | undefined;
}

/**
 * The hook's decision logic as a pure function, so the browser-free unit
 * project can test it — mirrors `toLibraryState` for the creature browser.
 */
export const toSpellLibraryState = ({
  isStatusPending,
  isListPending,
  status,
  spells,
  classOptions,
}: ToSpellLibraryStateArgs): Omit<
  SpellLibraryState,
  | 'search'
  | 'setSearch'
  | 'levelOptions'
  | 'selectedLevels'
  | 'setSelectedLevels'
  | 'selectedClassSlugs'
  | 'setSelectedClassSlugs'
> => ({
  ...toLibraryImportState({ isStatusPending, isListPending, status }),
  spells: (spells ?? []).map(spell => ({
    slug: spell.slug,
    name: spell.name,
    levelLabel: formatSpellLevel(spell.level),
    school: schoolLabel(spell.school),
  })),
  classOptions: (classOptions ?? []).map(option => ({
    value: option.slug,
    label: option.label,
  })),
});

export const useSpellLibrary = () => {
  const trpc = useTRPC();
  const [search, setSearch] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Array<string>>([]);
  const [selectedClassSlugs, setSelectedClassSlugs] = useState<Array<string>>(
    [],
  );

  const status = useQuery(trpc.library.status.queryOptions());
  const classes = useQuery(trpc.library.listSpellClasses.queryOptions());
  const list = useQuery(
    trpc.library.listSpells.queryOptions({
      search,
      levels: selectedLevels.map(Number),
      classSlugs: selectedClassSlugs,
    }),
  );

  return {
    ...toSpellLibraryState({
      isStatusPending: status.isPending,
      isListPending: list.isPending,
      status: status.data,
      spells: list.data,
      classOptions: classes.data,
    }),
    search,
    setSearch,
    levelOptions: SPELL_LEVEL_OPTIONS,
    selectedLevels,
    setSelectedLevels,
    selectedClassSlugs,
    setSelectedClassSlugs,
  };
};
