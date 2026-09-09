'use client';

import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import { EmptyState } from '~/atoms/EmptyState';
import { CreatureListItem } from '~/molecules/CreatureListItem';

export type CreatureSummary = {
  slug: string;
  name: string;
  challengeRatingLabel: string;
};

export type CreatureLibraryViewProps = {
  isPending: boolean;
  /** False until the library has been imported on this instance. */
  isLibraryImported: boolean;
  creatures: readonly CreatureSummary[];
  search: string;
  selectedSlug: string | null;
  onSearchChange: (search: string) => void;
  onSelect: (slug: string) => void;
  onAdd: (slug: string) => void;
};

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
  selectedSlug,
  onSearchChange,
  onSelect,
  onAdd,
}: CreatureLibraryViewProps) => (
  <Wrapper>
    <Controls>
      <TextInput
        value={search}
        onChange={event => onSearchChange(event.target.value)}
        placeholder="Filter…"
        aria-label="Filter creatures"
        disabled={!isLibraryImported}
      />
    </Controls>
    <Results>
      <ResultsBody
        isPending={isPending}
        isLibraryImported={isLibraryImported}
        creatures={creatures}
        search={search}
        selectedSlug={selectedSlug}
        onSelect={onSelect}
        onAdd={onAdd}
      />
    </Results>
  </Wrapper>
);

type ResultsBodyProps = Omit<CreatureLibraryViewProps, 'onSearchChange'>;

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
  onSelect,
  onAdd,
}: ResultsBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading creatures" />;

  if (!isLibraryImported) {
    return (
      <EmptyState
        title="No library yet"
        description="An instance imports the creature library the first time it boots. If this stayed empty, the import could not reach GitHub. Restart, or run it by hand."
        detail={<Command>pnpm db:import</Command>}
      />
    );
  }

  if (!creatures.length) {
    return (
      <EmptyState
        title="No matches"
        description={`Nothing in the library matches “${search}”.`}
      />
    );
  }

  return (
    <List>
      {creatures.map(creature => (
        <li key={creature.slug}>
          <CreatureListItem
            name={creature.name}
            challengeRatingLabel={creature.challengeRatingLabel}
            isSelected={creature.slug === selectedSlug}
            onSelect={() => onSelect(creature.slug)}
            onAdd={() => onAdd(creature.slug)}
          />
        </li>
      ))}
    </List>
  );
};

const Controls = styled.div`
  display: grid;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  min-height: 0;
  height: 100%;
`;

/** The scroll container, so the filter box above it stays put. */
const Results = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Skeleton = styled.div`
  height: 12rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;

const Command = styled.code`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.accent};
`;
