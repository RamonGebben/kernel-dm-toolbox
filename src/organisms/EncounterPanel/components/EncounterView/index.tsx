'use client';

import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { Modal } from '~/atoms/Modal';
import { CombatantRow } from '~/molecules/CombatantRow';
import { DifficultyReadout } from '~/molecules/DifficultyReadout';
import { HitPointControls } from '~/molecules/HitPointControls';
import { InitiativeRollForm } from '~/molecules/InitiativeRollForm';
import type { EncounterDifficulty } from '~/content/encounterDifficulty';
import { Wrapper } from '~/organisms/EncounterPanel/components/EncounterView/components/Wrapper';
import { Toolbar } from '~/organisms/EncounterPanel/components/EncounterView/components/Toolbar';
import { Stack } from '~/atoms/Stack';
import { Cluster } from '~/atoms/Cluster';
import { Round } from '~/organisms/EncounterPanel/components/EncounterView/components/Round';
import { ScrollArea } from '~/atoms/ScrollArea';
import { Headings } from '~/organisms/EncounterPanel/components/EncounterView/components/Headings';
import { PlainList } from '~/atoms/PlainList';
import { Skeleton } from '~/atoms/Skeleton';

export interface EncounterCombatantSummary {
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
  conditions: Array<{
    id: string;
    name: string;
    roundsRemaining: number | null;
    note: string | null;
  }>;
}

export interface EncounterDifficultySummary {
  difficulty: EncounterDifficulty;
  totalExperience: number;
  hasParty: boolean;
}

export interface EncounterViewProps {
  isPending: boolean;
  roundNumber: number;
  difficulty: EncounterDifficultySummary;
  combatants: ReadonlyArray<EncounterCombatantSummary>;
  selectedCombatantId: string | null;
  activeCombatantId: string | null;
  /** Whether the "Roll for initiative" dialog is open. */
  isRollingInitiative: boolean;
  isStarting: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleDelay: (id: string) => void;
  onOpenHitPoints: (id: string) => void;
  onOpenInitiativeRoll: () => void;
  onCloseInitiativeRoll: () => void;
  onStart: (initiatives: Array<{ id: string; initiative: number }>) => void;
  onEndCombat: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onClearMonsters: () => void;
  /** The combatant whose HP dialog is open, or null when it's closed —
   * opened by clicking the HP readout in that combatant's own row. */
  hitPointsCombatant: {
    displayName: string;
    currentHitPoints: number;
    maxHitPoints: number;
    temporaryHitPoints: number;
  } | null;
  isAdjustingHitPoints: boolean;
  onCloseHitPoints: () => void;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onGrantTemporary: (amount: number) => void;
}

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
  onOpenHitPoints,
  onOpenInitiativeRoll,
  onCloseInitiativeRoll,
  onStart,
  onEndCombat,
  onNextTurn,
  onPreviousTurn,
  onClearMonsters,
  hitPointsCombatant,
  isAdjustingHitPoints,
  onCloseHitPoints,
  onDamage,
  onHeal,
  onGrantTemporary,
}: EncounterViewProps) => {
  const monsterCount = combatants.filter(
    combatant => !combatant.isPlayerCharacter,
  ).length;
  const isStarted = roundNumber > 0;

  return (
    <Wrapper>
      <Toolbar>
        <Stack $gap="xs">
          <Round>{isStarted ? `Round ${roundNumber}` : 'Not started'}</Round>
          <DifficultyReadout
            difficulty={difficulty.difficulty}
            totalExperience={difficulty.totalExperience}
            hasParty={difficulty.hasParty}
          />
        </Stack>
        <Cluster>
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
        </Cluster>
      </Toolbar>

      <ScrollArea>
        <OrderBody
          isPending={isPending}
          combatants={combatants}
          selectedCombatantId={selectedCombatantId}
          activeCombatantId={activeCombatantId}
          onSelect={onSelect}
          onRemove={onRemove}
          onToggleDelay={onToggleDelay}
          onOpenHitPoints={onOpenHitPoints}
        />
      </ScrollArea>

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

      <Modal
        title={`Hit points: ${hitPointsCombatant?.displayName ?? ''}`}
        isOpen={hitPointsCombatant !== null}
        onClose={onCloseHitPoints}
      >
        {hitPointsCombatant && (
          <HitPointControls
            currentHitPoints={hitPointsCombatant.currentHitPoints}
            maxHitPoints={hitPointsCombatant.maxHitPoints}
            temporaryHitPoints={hitPointsCombatant.temporaryHitPoints}
            isPending={isAdjustingHitPoints}
            onDamage={onDamage}
            onHeal={onHeal}
            onGrantTemporary={onGrantTemporary}
          />
        )}
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
  | 'onOpenHitPoints'
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
  onOpenHitPoints,
}: OrderBodyProps) => {
  if (isPending)
    return <Skeleton $height="10rem" aria-label="Loading the encounter" />;

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
      <PlainList>
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
              onOpenHitPoints={() => onOpenHitPoints(combatant.id)}
            />
          </li>
        ))}
      </PlainList>
    </>
  );
};
