'use client';

import { TextInput } from '~/atoms/TextInput';
import { EmptyState } from '~/atoms/EmptyState';
import { Button } from '~/atoms/Button';
import { CheckboxList, type CheckboxListOption } from '~/atoms/CheckboxList';
import { CreatureListItem } from '~/molecules/CreatureListItem';
import { FilterBar } from '~/molecules/FilterBar';
import { summarizeRange, summarizeSelection } from '~/utils/summarizeFilter';
import {
  ChallengeRatingRangeFilter,
  type ChallengeRatingRange,
} from '~/organisms/CreatureLibrary/components/CreatureLibraryView/components/ChallengeRatingRangeFilter';
import { Footer } from '~/organisms/CreatureLibrary/components/CreatureLibraryView/components/Footer';
import { FillStack } from '~/atoms/FillStack';
import { ScrollArea } from '~/atoms/ScrollArea';
import { PlainList } from '~/atoms/PlainList';
import { Skeleton } from '~/atoms/Skeleton';
import { Command } from '~/atoms/Command';

export type { ChallengeRatingRange };

export type CreatureSource = 'library' | 'custom' | 'all';

export type CreatureSummary =
  | {
      source: 'library';
      slug: string;
      name: string;
      challengeRatingLabel: string;
    }
  | {
      source: 'custom';
      id: string;
      name: string;
      challengeRatingLabel: string;
    };

export interface CreatureLibraryViewProps {
  isPending: boolean;
  /** False until the library has been imported on this instance. */
  isLibraryImported: boolean;
  creatures: ReadonlyArray<CreatureSummary>;
  search: string;
  sourceOptions: ReadonlyArray<CheckboxListOption>;
  selectedSources: ReadonlyArray<string>;
  typeOptions: ReadonlyArray<CheckboxListOption>;
  selectedTypes: ReadonlyArray<string>;
  documentOptions: ReadonlyArray<CheckboxListOption>;
  selectedDocuments: ReadonlyArray<string>;
  challengeRatingOptions: ReadonlyArray<{ value: number; label: string }>;
  challengeRatingRange: ChallengeRatingRange;
  selectedSlug: string | null;
  selectedCustomCreatureId: string | null;
  onSearchChange: (search: string) => void;
  onSourcesChange: (sources: Array<string>) => void;
  onTypesChange: (types: Array<string>) => void;
  onDocumentsChange: (documents: Array<string>) => void;
  onMinChallengeRatingChange: (min: number | null) => void;
  onMaxChallengeRatingChange: (max: number | null) => void;
  onSelect: (creature: CreatureSummary) => void;
  onAdd: (creature: CreatureSummary) => void;
  onNewCreature: () => void;
}

/**
 * Presentational: every state is reachable from a story because nothing here
 * fetches.
 *
 * The branching is guard clauses in a fixed order — pending, then the two
 * distinct kinds of empty, then loaded.
 */
export const CreatureLibraryView = ({
  isPending,
  isLibraryImported,
  creatures,
  search,
  sourceOptions,
  selectedSources,
  typeOptions,
  selectedTypes,
  documentOptions,
  selectedDocuments,
  challengeRatingOptions,
  challengeRatingRange,
  selectedSlug,
  selectedCustomCreatureId,
  onSearchChange,
  onSourcesChange,
  onTypesChange,
  onDocumentsChange,
  onMinChallengeRatingChange,
  onMaxChallengeRatingChange,
  onSelect,
  onAdd,
  onNewCreature,
}: CreatureLibraryViewProps) => {
  // The Open5e import failing (or never running) shouldn't lock a DM out of
  // searching/filtering their own homebrew — only disable these controls
  // when there is truly nothing to search yet, custom or otherwise.
  const isUsable = isLibraryImported || creatures.length > 0;
  // A custom creature has no upstream document — narrowing to "Custom" makes
  // the Book filter meaningless, same reasoning as `category` server-side.
  const isCustomOnlySource =
    selectedSources.includes('custom') && !selectedSources.includes('library');

  return (
    <FillStack>
      <TextInput
        value={search}
        onChange={event => onSearchChange(event.target.value)}
        placeholder="Filter…"
        aria-label="Filter creatures"
        disabled={!isUsable}
      />
      <FilterBar
        disabled={!isUsable}
        filters={[
          {
            key: 'source',
            label: 'Source',
            summary: summarizeSelection(sourceOptions, selectedSources),
            onClear: () => onSourcesChange([]),
            editor: (
              <CheckboxList
                label="Source"
                options={sourceOptions}
                selectedValues={selectedSources}
                onChange={onSourcesChange}
              />
            ),
          },
          {
            key: 'type',
            label: 'Type',
            summary: summarizeSelection(typeOptions, selectedTypes),
            onClear: () => onTypesChange([]),
            editor: (
              <CheckboxList
                label="Type"
                options={typeOptions}
                selectedValues={selectedTypes}
                onChange={onTypesChange}
              />
            ),
          },
          {
            key: 'book',
            label: 'Book',
            summary: summarizeSelection(documentOptions, selectedDocuments),
            onClear: () => onDocumentsChange([]),
            disabled: isCustomOnlySource,
            editor: (
              <CheckboxList
                label="Book"
                options={documentOptions}
                selectedValues={selectedDocuments}
                onChange={onDocumentsChange}
              />
            ),
          },
          {
            key: 'challengeRating',
            label: 'CR',
            summary: summarizeRange(
              challengeRatingOptions,
              challengeRatingRange,
            ),
            onClear: () => {
              onMinChallengeRatingChange(null);
              onMaxChallengeRatingChange(null);
            },
            editor: (
              <ChallengeRatingRangeFilter
                options={challengeRatingOptions}
                range={challengeRatingRange}
                onMinChange={onMinChallengeRatingChange}
                onMaxChange={onMaxChallengeRatingChange}
              />
            ),
          },
        ]}
      />
      <ScrollArea>
        <ResultsBody
          isPending={isPending}
          isLibraryImported={isLibraryImported}
          creatures={creatures}
          search={search}
          selectedSlug={selectedSlug}
          selectedCustomCreatureId={selectedCustomCreatureId}
          onSelect={onSelect}
          onAdd={onAdd}
        />
      </ScrollArea>
      <Footer>
        <Button type="button" size="sm" isFullWidth onClick={onNewCreature}>
          New Creature
        </Button>
      </Footer>
    </FillStack>
  );
};

type ResultsBodyProps = Omit<
  CreatureLibraryViewProps,
  | 'onSearchChange'
  | 'sourceOptions'
  | 'selectedSources'
  | 'onSourcesChange'
  | 'typeOptions'
  | 'selectedTypes'
  | 'onTypesChange'
  | 'documentOptions'
  | 'selectedDocuments'
  | 'onDocumentsChange'
  | 'challengeRatingOptions'
  | 'challengeRatingRange'
  | 'onMinChallengeRatingChange'
  | 'onMaxChallengeRatingChange'
  | 'onNewCreature'
>;

/**
 * A real named subcomponent rather than a local JSX const, so the three
 * branches stay guard clauses instead of a ternary chain.
 */
const ResultsBody = ({
  isPending,
  isLibraryImported,
  creatures,
  search,
  selectedSlug,
  selectedCustomCreatureId,
  onSelect,
  onAdd,
}: ResultsBodyProps) => {
  if (isPending)
    return <Skeleton $height="12rem" aria-label="Loading creatures" />;

  // `isLibraryImported` only reflects the read-only Open5e import — a DM's
  // own custom creatures are unrelated to it, so this only renders the "no
  // library" empty state when there is truly nothing to show, custom or
  // otherwise. Checking `creatures.length` first keeps a DM's homebrew
  // visible even on an instance where the SRD import never succeeded.
  if (!creatures.length) {
    if (!isLibraryImported) {
      return (
        <EmptyState
          title="No library yet"
          description="An instance imports the creature library the first time it boots. If this stayed empty, the import could not reach GitHub. Restart, or run it by hand."
          detail={<Command>pnpm db:import</Command>}
        />
      );
    }

    return (
      <EmptyState
        title="No matches"
        description={`Nothing in the library matches “${search}”.`}
      />
    );
  }

  return (
    <PlainList>
      {creatures.map(creature => {
        const isSelected =
          creature.source === 'library'
            ? creature.slug === selectedSlug
            : creature.id === selectedCustomCreatureId;

        return (
          <li
            key={`${creature.source}-${creature.source === 'library' ? creature.slug : creature.id}`}
          >
            <CreatureListItem
              name={creature.name}
              challengeRatingLabel={creature.challengeRatingLabel}
              isSelected={isSelected}
              onSelect={() => onSelect(creature)}
              onAdd={() => onAdd(creature)}
            />
          </li>
        );
      })}
    </PlainList>
  );
};
