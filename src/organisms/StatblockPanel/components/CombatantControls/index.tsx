'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
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
  isHidden: boolean;
  isPending: boolean;
  conditions: readonly AppliedConditionSummary[];
  conditionOptions: readonly ConditionOption[];
  onToggleHidden: () => void;
  onApplyCondition: (input: {
    conditionSlug: string;
    roundsRemaining: number | null;
  }) => void;
  onRemoveCondition: (id: string) => void;
};

/**
 * What the DM does *to* the selected combatant, above the reference material
 * about it. Hit points live in their own dialog now, opened from the HP
 * readout in the tracker's own row — this panel is conditions and visibility.
 */
export const CombatantControls = ({
  displayName,
  isHidden,
  isPending,
  conditions,
  conditionOptions,
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
