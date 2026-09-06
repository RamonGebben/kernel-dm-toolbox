'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Modal } from '~/atoms/Modal';
import { rollExpression, type DiceRollResult } from '~/utils/rollDice';
import { applyDivisor, type Divisor } from '~/utils/applyDivisor';

export type DiceRollModalCombatant = {
  id: string;
  displayName: string;
  currentHitPoints: number;
  maxHitPoints: number;
};

export type DiceRollApplyIntent = 'damage' | 'heal';

export type DiceRollModalViewProps = {
  sides: number;
  modifier: number;
  initialCount: number;
  /** Only true for a roll triggered from a combatant's statblock. */
  canApplyToCombatants: boolean;
  combatants: readonly DiceRollModalCombatant[];
  isApplying: boolean;
  onClose: () => void;
  onApply: (
    intent: DiceRollApplyIntent,
    targets: { id: string; amount: number }[],
  ) => void;
};

type TargetRowState = { checked: boolean; divisor: Divisor };

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
    <Modal title={formatExpression(count, sides, modifier)} isOpen onClose={onClose}>
      <Section>
        <Stepper>
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
        </Stepper>

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

type RollResultProps = { result: DiceRollResult | null };

/** No roll yet vs. a result to show — a guard clause, not a ternary. */
const RollResult = ({ result }: RollResultProps) => {
  if (!result) return null;

  return (
    <Result>
      <RollValues>Rolls: {result.rolls.join(', ')}</RollValues>
      <Total>Total: {result.total}</Total>
    </Result>
  );
};

type ApplySectionProps = {
  combatants: readonly DiceRollModalCombatant[];
  targetState: Record<string, TargetRowState>;
  hasCheckedTarget: boolean;
  isApplying: boolean;
  onToggle: (id: string) => void;
  onDivisor: (id: string, divisor: Divisor) => void;
  onApply: (intent: DiceRollApplyIntent) => void;
};

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
      <Muted>No combatants in the encounter yet.</Muted>
    ) : (
      <TargetList>
        {combatants.map(combatant => {
          const row = targetState[combatant.id] ?? defaultRowState;

          return (
            <TargetRow key={combatant.id}>
              <TargetLabel>
                <input
                  type="checkbox"
                  checked={row.checked}
                  onChange={() => onToggle(combatant.id)}
                />
                {combatant.displayName} ({combatant.currentHitPoints}/
                {combatant.maxHitPoints})
              </TargetLabel>
              <Divisors>
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
              </Divisors>
            </TargetRow>
          );
        })}
      </TargetList>
    )}

    <ApplyActions>
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
    </ApplyActions>
  </Section>
);

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};

  & + & {
    margin-top: ${props => props.theme.space.md};
    padding-top: ${props => props.theme.space.md};
    border-top: 1px solid ${props => props.theme.color.border};
  }
`;

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
`;

const Count = styled.span`
  min-width: 2ch;
  text-align: center;
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Result = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const RollValues = styled.span`
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Total = styled.span`
  font-size: ${props => props.theme.fontSize.lg};
  font-weight: 600;
  color: ${props => props.theme.color.accent};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textPrimary};
`;

const Muted = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const TargetList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TargetRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const TargetLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Divisors = styled.div`
  display: flex;
  gap: ${props => props.theme.space.xs};
`;

const DivisorButton = styled.button<{ $isActive: boolean }>`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  background: ${props =>
    props.$isActive ? props.theme.color.accent : 'transparent'};
  color: ${props =>
    props.$isActive
      ? props.theme.color.textInverted
      : props.theme.color.textMuted};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  cursor: pointer;

  &:hover {
    color: ${props =>
      props.$isActive
        ? props.theme.color.textInverted
        : props.theme.color.textPrimary};
  }
`;

const ApplyActions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
