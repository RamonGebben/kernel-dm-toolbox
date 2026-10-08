'use client';

import { TextInput } from '~/atoms/TextInput';
import { EmptyState } from '~/atoms/EmptyState';
import { CheckboxList, type CheckboxListOption } from '~/atoms/CheckboxList';
import { FilterBar } from '~/molecules/FilterBar';
import { SpellListItem } from '~/molecules/SpellListItem';
import { summarizeSelection } from '~/utils/summarizeFilter';
import { FillStack } from '~/atoms/FillStack';
import { ScrollArea } from '~/atoms/ScrollArea';
import { PlainList } from '~/atoms/PlainList';
import { Skeleton } from '~/atoms/Skeleton';
import { Command } from '~/atoms/Command';

export interface SpellSummary {
  slug: string;
  name: string;
  levelLabel: string;
  school: string;
}

export interface SpellLibraryViewProps {
  isPending: boolean;
  /** False until the library has been imported on this instance. */
  isLibraryImported: boolean;
  spells: ReadonlyArray<SpellSummary>;
  search: string;
  selectedSlug: string | null;
  onSearchChange: (search: string) => void;
  onSelect: (slug: string) => void;
  levelOptions: ReadonlyArray<CheckboxListOption>;
  selectedLevels: ReadonlyArray<string>;
  onLevelsChange: (levels: Array<string>) => void;
  classOptions: ReadonlyArray<CheckboxListOption>;
  selectedClassSlugs: ReadonlyArray<string>;
  onClassSlugsChange: (classSlugs: Array<string>) => void;
}

/**
 * Presentational: every state is reachable from a story because nothing here
 * fetches. Mirrors `CreatureLibraryView` — pending, then the two distinct
 * kinds of empty, then loaded, as guard clauses rather than a ternary chain.
 */
export const SpellLibraryView = ({
  isPending,
  isLibraryImported,
  spells,
  search,
  selectedSlug,
  onSearchChange,
  onSelect,
  levelOptions,
  selectedLevels,
  onLevelsChange,
  classOptions,
  selectedClassSlugs,
  onClassSlugsChange,
}: SpellLibraryViewProps) => (
  <FillStack>
    <TextInput
      value={search}
      onChange={event => onSearchChange(event.target.value)}
      placeholder="Filter spells…"
      aria-label="Filter spells"
      disabled={!isLibraryImported}
    />
    <FilterBar
      disabled={!isLibraryImported}
      filters={[
        {
          key: 'level',
          label: 'Level',
          summary: summarizeSelection(levelOptions, selectedLevels),
          onClear: () => onLevelsChange([]),
          editor: (
            <CheckboxList
              label="Level"
              options={levelOptions}
              selectedValues={selectedLevels}
              onChange={onLevelsChange}
            />
          ),
        },
        {
          key: 'class',
          label: 'Class',
          summary: summarizeSelection(classOptions, selectedClassSlugs),
          onClear: () => onClassSlugsChange([]),
          editor: (
            <CheckboxList
              label="Class"
              options={classOptions}
              selectedValues={selectedClassSlugs}
              onChange={onClassSlugsChange}
            />
          ),
        },
      ]}
    />
    <ScrollArea>
      <ResultsBody
        isPending={isPending}
        isLibraryImported={isLibraryImported}
        spells={spells}
        search={search}
        selectedSlug={selectedSlug}
        onSelect={onSelect}
      />
    </ScrollArea>
  </FillStack>
);

type ResultsBodyProps = Omit<
  SpellLibraryViewProps,
  | 'onSearchChange'
  | 'levelOptions'
  | 'selectedLevels'
  | 'onLevelsChange'
  | 'classOptions'
  | 'selectedClassSlugs'
  | 'onClassSlugsChange'
>;

/**
 * A real named subcomponent rather than a local JSX const, so the three
 * branches stay guard clauses instead of a ternary chain.
 */
const ResultsBody = ({
  isPending,
  isLibraryImported,
  spells,
  search,
  selectedSlug,
  onSelect,
}: ResultsBodyProps) => {
  if (isPending)
    return <Skeleton $height="12rem" aria-label="Loading spells" />;

  if (!isLibraryImported) {
    return (
      <EmptyState
        title="No library yet"
        description="An instance imports the spell library the first time it boots. If this stayed empty, the import could not reach GitHub. Restart, or run it by hand."
        detail={<Command>pnpm db:import</Command>}
      />
    );
  }

  if (!spells.length) {
    return (
      <EmptyState
        title="No matches"
        description={`Nothing in the library matches “${search}”.`}
      />
    );
  }

  return (
    <PlainList>
      {spells.map(spell => (
        <li key={spell.slug}>
          <SpellListItem
            name={spell.name}
            levelLabel={spell.levelLabel}
            school={spell.school}
            isSelected={spell.slug === selectedSlug}
            onSelect={() => onSelect(spell.slug)}
          />
        </li>
      ))}
    </PlainList>
  );
};
