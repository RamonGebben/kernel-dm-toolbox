'use client';

import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { CharacterRow } from '~/molecules/CharacterRow';
import { FillStack } from '~/atoms/FillStack';
import { SpreadRow } from '~/atoms/SpreadRow';
import { ManageLink } from '~/organisms/CharacterRoster/components/CharacterRosterView/components/ManageLink';
import { ScrollArea } from '~/atoms/ScrollArea';
import { PlainList } from '~/atoms/PlainList';
import { Skeleton } from '~/atoms/Skeleton';

export interface RosterCharacter {
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
}

export interface CharacterRosterViewProps {
  isPending: boolean;
  /** Active party members — the bench is not offered here. */
  characters: ReadonlyArray<RosterCharacter>;
  /** Ids already in the encounter, so they cannot be added a second time. */
  combatantCharacterIds: ReadonlyArray<string>;
  /** False once every active member is already in the fight. */
  canAddAll: boolean;
  isAddingAll: boolean;
  onAddToEncounter: (character: RosterCharacter) => void;
  onAddAllActive: () => void;
}

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
  <FillStack>
    <SpreadRow>
      <Button
        size="sm"
        disabled={isPending || !canAddAll || isAddingAll}
        onClick={onAddAllActive}
      >
        {isAddingAll ? 'Adding…' : 'Add all active'}
      </Button>
      <ManageLink href="/party">Manage the party →</ManageLink>
    </SpreadRow>

    <ScrollArea>
      <RosterBody
        isPending={isPending}
        characters={characters}
        combatantCharacterIds={combatantCharacterIds}
        onAddToEncounter={onAddToEncounter}
      />
    </ScrollArea>
  </FillStack>
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
    return <Skeleton $height="8rem" aria-label="Loading characters" />;

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
    <PlainList>
      {characters.map(character => (
        <li key={character.id}>
          <CharacterRow
            {...character}
            isInEncounter={combatantCharacterIds.includes(character.id)}
            onAddToEncounter={() => onAddToEncounter(character)}
          />
        </li>
      ))}
    </PlainList>
  );
};
