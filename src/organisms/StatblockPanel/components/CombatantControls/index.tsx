'use client';

import { Button } from '~/atoms/Button';
import {
  ConditionPicker,
  type ConditionOption,
} from '~/molecules/ConditionPicker';
import {
  ConditionBadges,
  type AppliedConditionSummary,
} from '~/molecules/ConditionBadges';
import { Wrapper } from '~/organisms/StatblockPanel/components/CombatantControls/components/Wrapper';
import { SpreadRow } from '~/atoms/SpreadRow';
import { Name } from '~/organisms/StatblockPanel/components/CombatantControls/components/Name';

export interface CombatantControlsProps {
  displayName: string;
  isHidden: boolean;
  isPending: boolean;
  conditions: ReadonlyArray<AppliedConditionSummary>;
  conditionOptions: ReadonlyArray<ConditionOption>;
  onToggleHidden: () => void;
  onApplyCondition: (input: {
    conditionSlug: string;
    roundsRemaining: number | null;
  }) => void;
  onRemoveCondition: (id: string) => void;
}

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
    <SpreadRow>
      <Name>{displayName}</Name>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleHidden}
        aria-pressed={isHidden}
      >
        {isHidden ? 'Reveal to players' : 'Hide from players'}
      </Button>
    </SpreadRow>

    <ConditionBadges conditions={conditions} onRemove={onRemoveCondition} />
    <ConditionPicker
      options={conditionOptions}
      isPending={isPending}
      onApply={onApplyCondition}
    />
  </Wrapper>
);
