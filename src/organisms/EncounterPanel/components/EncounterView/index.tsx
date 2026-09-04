'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { CombatantRow } from '~/molecules/CombatantRow';

export type EncounterCombatantSummary = {
  id: string;
  displayName: string;
  initiative: number;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  isHidden: boolean;
  isPlayerCharacter: boolean;
};

export type EncounterViewProps = {
  isPending: boolean;
  roundNumber: number;
  combatants: readonly EncounterCombatantSummary[];
  selectedCombatantId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClearMonsters: () => void;
};

/** Presentational: the centre column of the tracker. */
export const EncounterView = ({
  isPending,
  roundNumber,
  combatants,
  selectedCombatantId,
  onSelect,
  onRemove,
  onClearMonsters,
}: EncounterViewProps) => {
  const monsterCount = combatants.filter(
    combatant => !combatant.isPlayerCharacter,
  ).length;

  return (
    <Wrapper>
      <Toolbar>
        <Round>
          {roundNumber > 0 ? `Round ${roundNumber}` : 'Not started'}
        </Round>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearMonsters}
          disabled={monsterCount === 0}
        >
          Clear monsters
        </Button>
      </Toolbar>

      <Body>
        <OrderBody
          isPending={isPending}
          combatants={combatants}
          selectedCombatantId={selectedCombatantId}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </Body>
    </Wrapper>
  );
};

type OrderBodyProps = Pick<
  EncounterViewProps,
  'isPending' | 'combatants' | 'selectedCombatantId' | 'onSelect' | 'onRemove'
>;

const OrderBody = ({
  isPending,
  combatants,
  selectedCombatantId,
  onSelect,
  onRemove,
}: OrderBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading the encounter" />;

  if (!combatants.length) {
    return (
      <EmptyState
        title="No combatants yet"
        description="Add creatures and characters from the left to build the fight."
      />
    );
  }

  return (
    <>
      <Headings aria-hidden="true">
        <span>Init</span>
        <span>Name</span>
        <span>HP</span>
        <span>AC</span>
        <span />
      </Headings>
      <List>
        {combatants.map(combatant => (
          <li key={combatant.id}>
            <CombatantRow
              displayName={combatant.displayName}
              initiative={combatant.initiative}
              currentHitPoints={combatant.currentHitPoints}
              maxHitPoints={combatant.maxHitPoints}
              temporaryHitPoints={combatant.temporaryHitPoints}
              armorClass={combatant.armorClass}
              isHidden={combatant.isHidden}
              isSelected={combatant.id === selectedCombatantId}
              onSelect={() => onSelect(combatant.id)}
              onRemove={() => onRemove(combatant.id)}
            />
          </li>
        ))}
      </List>
    </>
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
  gap: ${props => props.theme.space.md};
`;

const Round = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const Headings = styled.div`
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 5.5rem 3rem 2.5rem;
  gap: ${props => props.theme.space.sm};
  padding: 0 ${props => props.theme.space.md} ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
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
  height: 10rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
