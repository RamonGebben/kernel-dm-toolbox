'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { Modal } from '~/atoms/Modal';
import { CombatantRow } from '~/molecules/CombatantRow';
import { DifficultyReadout } from '~/molecules/DifficultyReadout';
import { InitiativeRollForm } from '~/molecules/InitiativeRollForm';
import type { EncounterDifficulty } from '~/content/encounterDifficulty';

export type EncounterCombatantSummary = {
  id: string;
  displayName: string;
  initiative: number;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  isHidden: boolean;
  isDelayed: boolean;
  isPlayerCharacter: boolean;
  /** Null for a player character; drives the reroll in the initiative form. */
  initiativeBonus: number | null;
  conditions: {
    id: string;
    name: string;
    roundsRemaining: number | null;
    note: string | null;
  }[];
};

export type EncounterDifficultySummary = {
  difficulty: EncounterDifficulty;
  totalExperience: number;
  hasParty: boolean;
};

export type EncounterViewProps = {
  isPending: boolean;
  roundNumber: number;
  difficulty: EncounterDifficultySummary;
  combatants: readonly EncounterCombatantSummary[];
  selectedCombatantId: string | null;
  activeCombatantId: string | null;
  /** Whether the "Roll for initiative" dialog is open. */
  isRollingInitiative: boolean;
  isStarting: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleDelay: (id: string) => void;
  onOpenInitiativeRoll: () => void;
  onCloseInitiativeRoll: () => void;
  onStart: (initiatives: { id: string; initiative: number }[]) => void;
  onEndCombat: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onClearMonsters: () => void;
};

/** Presentational: the centre column of the tracker. */
export const EncounterView = ({
  isPending,
  roundNumber,
  difficulty,
  combatants,
  selectedCombatantId,
  activeCombatantId,
  isRollingInitiative,
  isStarting,
  onSelect,
  onRemove,
  onToggleDelay,
  onOpenInitiativeRoll,
  onCloseInitiativeRoll,
  onStart,
  onEndCombat,
  onNextTurn,
  onPreviousTurn,
  onClearMonsters,
}: EncounterViewProps) => {
  const monsterCount = combatants.filter(
    combatant => !combatant.isPlayerCharacter,
  ).length;
  const isStarted = roundNumber > 0;

  return (
    <Wrapper>
      <Toolbar>
        <Status>
          <Round>{isStarted ? `Round ${roundNumber}` : 'Not started'}</Round>
          <DifficultyReadout
            difficulty={difficulty.difficulty}
            totalExperience={difficulty.totalExperience}
            hasParty={difficulty.hasParty}
          />
        </Status>
        <ToolbarActions>
          <TurnActions
            isStarted={isStarted}
            hasCombatants={combatants.length > 0}
            onOpenInitiativeRoll={onOpenInitiativeRoll}
            onNextTurn={onNextTurn}
            onPreviousTurn={onPreviousTurn}
            onEndCombat={onEndCombat}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearMonsters}
            disabled={monsterCount === 0}
          >
            Clear monsters
          </Button>
        </ToolbarActions>
      </Toolbar>

      <Body>
        <OrderBody
          isPending={isPending}
          combatants={combatants}
          selectedCombatantId={selectedCombatantId}
          activeCombatantId={activeCombatantId}
          onSelect={onSelect}
          onRemove={onRemove}
          onToggleDelay={onToggleDelay}
        />
      </Body>

      <Modal
        title="Roll for initiative"
        isOpen={isRollingInitiative}
        onClose={onCloseInitiativeRoll}
      >
        <InitiativeRollForm
          rows={combatants.map(combatant => ({
            id: combatant.id,
            displayName: combatant.displayName,
            isPlayerCharacter: combatant.isPlayerCharacter,
            initiative: combatant.initiative,
            initiativeBonus: combatant.initiativeBonus,
          }))}
          isSaving={isStarting}
          onSubmit={onStart}
          onCancel={onCloseInitiativeRoll}
        />
      </Modal>
    </Wrapper>
  );
};

type TurnActionsProps = {
  isStarted: boolean;
  hasCombatants: boolean;
} & Pick<
  EncounterViewProps,
  'onOpenInitiativeRoll' | 'onNextTurn' | 'onPreviousTurn' | 'onEndCombat'
>;

/**
 * Before and during a fight are two different toolbars, not one toolbar with
 * disabled buttons: "Back" and "End combat" are meaningless before initiative
 * is rolled, and the single most important control changes from "Roll for
 * initiative" to "Next turn".
 */
const TurnActions = ({
  isStarted,
  hasCombatants,
  onOpenInitiativeRoll,
  onNextTurn,
  onPreviousTurn,
  onEndCombat,
}: TurnActionsProps) => {
  if (!isStarted) {
    return (
      <Button
        size="sm"
        onClick={onOpenInitiativeRoll}
        disabled={!hasCombatants}
      >
        Roll for initiative
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onPreviousTurn}>
        Back
      </Button>
      <Button size="sm" onClick={onNextTurn}>
        Next turn
      </Button>
      <Button variant="secondary" size="sm" onClick={onEndCombat}>
        End combat
      </Button>
    </>
  );
};

type OrderBodyProps = Pick<
  EncounterViewProps,
  | 'isPending'
  | 'combatants'
  | 'selectedCombatantId'
  | 'activeCombatantId'
  | 'onSelect'
  | 'onRemove'
  | 'onToggleDelay'
>;

/** A named subcomponent, so the branches stay guard clauses. */
const OrderBody = ({
  isPending,
  combatants,
  selectedCombatantId,
  activeCombatantId,
  onSelect,
  onRemove,
  onToggleDelay,
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
              isDelayed={combatant.isDelayed}
              conditions={combatant.conditions}
              isActive={combatant.id === activeCombatantId}
              isSelected={combatant.id === selectedCombatantId}
              onSelect={() => onSelect(combatant.id)}
              onToggleDelay={() => onToggleDelay(combatant.id)}
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
  height: calc(100% - ${props => props.theme.space.lg});
  min-height: 0;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.md};
  flex-wrap: wrap;
`;

const Status = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const ToolbarActions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
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
