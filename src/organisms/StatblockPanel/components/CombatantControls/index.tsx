'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { HitPointControls } from '~/molecules/HitPointControls';
import {
  ConditionPicker,
  type ConditionOption,
} from '~/molecules/ConditionPicker';
import {
  ConditionBadges,
  type AppliedConditionSummary,
} from '~/molecules/ConditionBadges';

export type CombatantControlsProps = {
  displayName: string;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  isHidden: boolean;
  isPending: boolean;
  conditions: readonly AppliedConditionSummary[];
  conditionOptions: readonly ConditionOption[];
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onGrantTemporary: (amount: number) => void;
  onToggleHidden: () => void;
  onApplyCondition: (input: {
    conditionSlug: string;
    roundsRemaining: number | null;
  }) => void;
  onRemoveCondition: (id: string) => void;
};

/**
 * What the DM does *to* the selected combatant, above the reference material
 * about it. Hit points first, because that is the thing being changed every
 * round; hiding is a per-fight decision made once.
 */
export const CombatantControls = ({
  displayName,
  currentHitPoints,
  maxHitPoints,
  temporaryHitPoints,
  isHidden,
  isPending,
  conditions,
  conditionOptions,
  onDamage,
  onHeal,
  onGrantTemporary,
  onToggleHidden,
  onApplyCondition,
  onRemoveCondition,
}: CombatantControlsProps) => (
  <Wrapper>
    <Header>
      <Name>{displayName}</Name>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleHidden}
        aria-pressed={isHidden}
      >
        {isHidden ? 'Reveal to players' : 'Hide from players'}
      </Button>
    </Header>

    <HitPointControls
      currentHitPoints={currentHitPoints}
      maxHitPoints={maxHitPoints}
      temporaryHitPoints={temporaryHitPoints}
      isPending={isPending}
      onDamage={onDamage}
      onHeal={onHeal}
      onGrantTemporary={onGrantTemporary}
    />

    <ConditionBadges conditions={conditions} onRemove={onRemoveCondition} />
    <ConditionPicker
      options={conditionOptions}
      isPending={isPending}
      onApply={onApplyCondition}
    />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  margin-bottom: ${props => props.theme.space.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Name = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;
