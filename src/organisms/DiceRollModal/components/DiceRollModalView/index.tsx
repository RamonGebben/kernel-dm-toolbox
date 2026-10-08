'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { Modal } from '~/atoms/Modal';
import { rollExpression, type DiceRollResult } from '~/utils/rollDice';
import { applyDivisor, type Divisor } from '~/utils/applyDivisor';
import { Section } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/Section';
import { InlineRow } from '~/atoms/InlineRow';
import { Count } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/Count';
import { Stack } from '~/atoms/Stack';
import { RollValues } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/RollValues';
import { Total } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/Total';
import { SectionTitle } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/SectionTitle';
import { MutedNote } from '~/atoms/MutedNote';
import { PlainList } from '~/atoms/PlainList';
import { SpreadRow } from '~/atoms/SpreadRow';
import { TargetLabel } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/TargetLabel';
import { Cluster } from '~/atoms/Cluster';
import { DivisorButton } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/DivisorButton';

export interface DiceRollModalCombatant {
  id: string;
  displayName: string;
  currentHitPoints: number;
  maxHitPoints: number;
}

export type DiceRollApplyIntent = 'damage' | 'heal';

export interface DiceRollModalViewProps {
  sides: number;
  modifier: number;
  initialCount: number;
  /** Only true for a roll triggered from a combatant's statblock. */
  canApplyToCombatants: boolean;
  combatants: ReadonlyArray<DiceRollModalCombatant>;
  isApplying: boolean;
  onClose: () => void;
  onApply: (
    intent: DiceRollApplyIntent,
    targets: Array<{ id: string; amount: number }>,
  ) => void;
}

interface TargetRowState {
  checked: boolean;
  divisor: Divisor;
}

const defaultRowState: TargetRowState = { checked: false, divisor: 1 };

/**
 * The dice-roll dialog: expression, a Roll button, and — only for a roll
 * that came from a combatant's statblock — a per-combatant apply section.
 *
 * Presentational: `DiceRollModal` owns the store subscription and the
 * combatant fetch/mutations, this owns only the roll and target-picking
 * interaction state.
 */
export const DiceRollModalView = ({
  sides,
  modifier,
  initialCount,
  canApplyToCombatants,
  combatants,
  isApplying,
  onClose,
  onApply,
}: DiceRollModalViewProps) => {
  const [count, setCount] = useState(initialCount);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [targetState, setTargetState] = useState<
    Record<string, TargetRowState>
  >({});

  const roll = () => setResult(rollExpression(count, sides, modifier));

  const setRow = (id: string, changes: Partial<TargetRowState>) =>
    setTargetState(previous => ({
      ...previous,
      [id]: { ...(previous[id] ?? defaultRowState), ...changes },
    }));

  const checkedTargets = combatants.filter(
    combatant => (targetState[combatant.id] ?? defaultRowState).checked,
  );

  const apply = (intent: DiceRollApplyIntent) => {
    if (!result || checkedTargets.length === 0) return;

    onApply(
      intent,
      checkedTargets.map(combatant => ({
        id: combatant.id,
        amount: applyDivisor(
          result.total,
          (targetState[combatant.id] ?? defaultRowState).divisor,
        ),
      })),
    );
  };

  return (
    <Modal
      title={formatExpression(count, sides, modifier)}
      isOpen
      onClose={onClose}
    >
      <Section>
        <InlineRow>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Decrease dice count"
            disabled={count <= 1}
            onClick={() => setCount(current => Math.max(1, current - 1))}
          >
            −
          </Button>
          <Count>{count}</Count>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Increase dice count"
            onClick={() => setCount(current => Math.min(100, current + 1))}
          >
            +
          </Button>
        </InlineRow>

        <Button type="button" onClick={roll}>
          Roll
        </Button>
      </Section>

      <RollResult result={result} />

      {canApplyToCombatants && result && (
        <ApplySection
          combatants={combatants}
          targetState={targetState}
          hasCheckedTarget={checkedTargets.length > 0}
          isApplying={isApplying}
          onToggle={id =>
            setRow(id, {
              checked: !(targetState[id] ?? defaultRowState).checked,
            })
          }
          onDivisor={(id, divisor) => setRow(id, { divisor })}
          onApply={apply}
        />
      )}
    </Modal>
  );
};

const formatExpression = (count: number, sides: number, modifier: number) => {
  const base = `${count}d${sides}`;
  if (modifier === 0) return base;
  return `${base} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`;
};

interface RollResultProps {
  result: DiceRollResult | null;
}

/** No roll yet vs. a result to show — a guard clause, not a ternary. */
const RollResult = ({ result }: RollResultProps) => {
  if (!result) return null;

  return (
    <Stack $gap="xs">
      <RollValues>Rolls: {result.rolls.join(', ')}</RollValues>
      <Total>Total: {result.total}</Total>
    </Stack>
  );
};

interface ApplySectionProps {
  combatants: ReadonlyArray<DiceRollModalCombatant>;
  targetState: Record<string, TargetRowState>;
  hasCheckedTarget: boolean;
  isApplying: boolean;
  onToggle: (id: string) => void;
  onDivisor: (id: string, divisor: Divisor) => void;
  onApply: (intent: DiceRollApplyIntent) => void;
}

const divisorLabel: Record<Divisor, string> = { 1: 'Full', 2: '½', 4: '¼' };

const ApplySection = ({
  combatants,
  targetState,
  hasCheckedTarget,
  isApplying,
  onToggle,
  onDivisor,
  onApply,
}: ApplySectionProps) => (
  <Section>
    <SectionTitle>Apply to combatants</SectionTitle>

    {combatants.length === 0 ? (
      <MutedNote>No combatants in the encounter yet.</MutedNote>
    ) : (
      <PlainList>
        {combatants.map(combatant => {
          const row = targetState[combatant.id] ?? defaultRowState;

          return (
            <SpreadRow as="li" key={combatant.id}>
              <TargetLabel>
                <input
                  type="checkbox"
                  checked={row.checked}
                  onChange={() => onToggle(combatant.id)}
                />
                {combatant.displayName} ({combatant.currentHitPoints}/
                {combatant.maxHitPoints})
              </TargetLabel>
              <Cluster $gap="xs">
                {([1, 2, 4] as const).map(divisor => (
                  <DivisorButton
                    key={divisor}
                    type="button"
                    aria-pressed={row.divisor === divisor}
                    $isActive={row.divisor === divisor}
                    onClick={() => onDivisor(combatant.id, divisor)}
                  >
                    {divisorLabel[divisor]}
                  </DivisorButton>
                ))}
              </Cluster>
            </SpreadRow>
          );
        })}
      </PlainList>
    )}

    <Cluster>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!hasCheckedTarget || isApplying}
        onClick={() => onApply('damage')}
      >
        Apply as Damage
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!hasCheckedTarget || isApplying}
        onClick={() => onApply('heal')}
      >
        Apply as Heal
      </Button>
    </Cluster>
  </Section>
);
