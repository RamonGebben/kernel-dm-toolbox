'use client';

import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import { EmptyState } from '~/atoms/EmptyState';
import { SpellListItem } from '~/molecules/SpellListItem';

export type SpellSummary = {
  slug: string;
  name: string;
  levelLabel: string;
  school: string;
};

export type SpellLibraryViewProps = {
  isPending: boolean;
  /** False until the library has been imported on this instance. */
  isLibraryImported: boolean;
  spells: readonly SpellSummary[];
  search: string;
  selectedSlug: string | null;
  onSearchChange: (search: string) => void;
  onSelect: (slug: string) => void;
};

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
}: SpellLibraryViewProps) => (
  <Wrapper>
    <TextInput
      value={search}
      onChange={event => onSearchChange(event.target.value)}
      placeholder="Filter spells…"
      aria-label="Filter spells"
      disabled={!isLibraryImported}
    />
    <Results>
      <ResultsBody
        isPending={isPending}
        isLibraryImported={isLibraryImported}
        spells={spells}
        search={search}
        selectedSlug={selectedSlug}
        onSelect={onSelect}
      />
    </Results>
  </Wrapper>
);

type ResultsBodyProps = Omit<SpellLibraryViewProps, 'onSearchChange'>;

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
  if (isPending) return <Skeleton role="status" aria-label="Loading spells" />;

  if (!isLibraryImported) {
    return (
      <EmptyState
        title="No library yet"
        description="An instance imports the spell library the first time it boots. If this stayed empty, the import could not reach GitHub — restart, or run it by hand."
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
    <List>
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
    </List>
  );
};

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
