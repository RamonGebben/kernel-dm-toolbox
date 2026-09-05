'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { formatSpellLevel } from '~/utils/formatSpellLevel';
import { slugToTitle } from '~/utils/slugToTitle';
import type { SpellSummary } from '~/organisms/SpellLibrary/components/SpellLibraryView';

type LibraryStatus = { isImported: boolean } | undefined;

type RawSpellSummary = {
  slug: string;
  name: string;
  level: number;
  school: string;
};

export type SpellLibraryState = {
  isPending: boolean;
  isLibraryImported: boolean;
  spells: SpellSummary[];
  search: string;
  setSearch: (search: string) => void;
};

type ToSpellLibraryStateArgs = {
  isStatusPending: boolean;
  isListPending: boolean;
  status: LibraryStatus;
  spells: RawSpellSummary[] | undefined;
};

/** The strip-and-title-case a spell's school slug shares with `buildSpellDetail`. */
const schoolLabel = (school: string): string =>
  slugToTitle(school.replace(/^[a-z0-9]+(?:-[a-z0-9]+)*_/, ''));

/**
 * The hook's decision logic as a pure function, so the browser-free unit
 * project can test it — mirrors `toLibraryState` for the creature browser.
 */
export const toSpellLibraryState = ({
  isStatusPending,
  isListPending,
  status,
  spells,
}: ToSpellLibraryStateArgs): Omit<
  SpellLibraryState,
  'search' | 'setSearch'
> => ({
  isPending: isStatusPending || isListPending,
  isLibraryImported: status?.isImported ?? false,
  spells: (spells ?? []).map(spell => ({
    slug: spell.slug,
    name: spell.name,
    levelLabel: formatSpellLevel(spell.level),
    school: schoolLabel(spell.school),
  })),
});

export const useSpellLibrary = () => {
  const trpc = useTRPC();
  const [search, setSearch] = useState('');

  const status = useQuery(trpc.library.status.queryOptions());
  const list = useQuery(trpc.library.listSpells.queryOptions({ search }));

  return {
    ...toSpellLibraryState({
      isStatusPending: status.isPending,
      isListPending: list.isPending,
      status: status.data,
      spells: list.data,
    }),
    search,
    setSearch,
  };
};
