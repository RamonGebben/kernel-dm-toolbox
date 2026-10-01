'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { CharacterRow } from '~/molecules/CharacterRow';

export type RosterCharacter = {
  id: string;
  name: string;
  playerName: string | null;
  level: number;
  className: string | null;
  subclass: string | null;
  species: string | null;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
};

export type CharacterRosterViewProps = {
  isPending: boolean;
  /** Active party members — the bench is not offered here. */
  characters: readonly RosterCharacter[];
  /** Ids already in the encounter, so they cannot be added a second time. */
  combatantCharacterIds: readonly string[];
  /** False once every active member is already in the fight. */
  canAddAll: boolean;
  isAddingAll: boolean;
  onAddToEncounter: (character: RosterCharacter) => void;
  onAddAllActive: () => void;
};

/**
 * Picking who is at the table tonight. Presentational: props in, JSX out,
 * every state reachable from a story. Creating and editing characters lives
 * on the Party page (DECISIONS #32) — this only links there.
 */
export const CharacterRosterView = ({
  isPending,
  characters,
  combatantCharacterIds,
  canAddAll,
  isAddingAll,
  onAddToEncounter,
  onAddAllActive,
}: CharacterRosterViewProps) => (
  <Wrapper>
    <Toolbar>
      <Button
        size="sm"
        disabled={isPending || !canAddAll || isAddingAll}
        onClick={onAddAllActive}
      >
        {isAddingAll ? 'Adding…' : 'Add all active'}
      </Button>
      <ManageLink href="/party">Manage the party →</ManageLink>
    </Toolbar>

    <Results>
      <RosterBody
        isPending={isPending}
        characters={characters}
        combatantCharacterIds={combatantCharacterIds}
        onAddToEncounter={onAddToEncounter}
      />
    </Results>
  </Wrapper>
);

type RosterBodyProps = Pick<
  CharacterRosterViewProps,
  'isPending' | 'characters' | 'combatantCharacterIds' | 'onAddToEncounter'
>;

/** A named subcomponent rather than a local const, so the guards stay guards. */
const RosterBody = ({
  isPending,
  characters,
  combatantCharacterIds,
  onAddToEncounter,
}: RosterBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading characters" />;

  if (!characters.length) {
    return (
      <EmptyState
        title="No active party members"
        description="Characters are created on the Party page; every active one shows up here to pick into a fight."
        detail={<ManageLink href="/party">Go to the Party page</ManageLink>}
      />
    );
  }

  return (
    <List>
      {characters.map(character => (
        <li key={character.id}>
          <CharacterRow
            {...character}
            isInEncounter={combatantCharacterIds.includes(character.id)}
            onAddToEncounter={() => onAddToEncounter(character)}
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
  height: 100%;
  min-height: 0;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const ManageLink = styled(Link)`
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  color: ${props => props.theme.color.accent};
`;

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
  height: 8rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
