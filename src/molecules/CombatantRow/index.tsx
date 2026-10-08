'use client';

import { Button } from '~/atoms/Button';
import {
  ConditionBadges,
  type AppliedConditionSummary,
} from '~/molecules/ConditionBadges';
import { toHitPointTone } from '~/utils/applyDamage';
import { Row } from '~/molecules/CombatantRow/components/Row';
import { Initiative } from '~/molecules/CombatantRow/components/Initiative';
import { SelectButton } from '~/molecules/CombatantRow/components/SelectButton';
import { Badge } from '~/molecules/CombatantRow/components/Badge';
import { HitPointsButton } from '~/molecules/CombatantRow/components/HitPointsButton';
import { Temporary } from '~/molecules/CombatantRow/components/Temporary';
import { MonoMuted } from '~/atoms/MonoMuted';
import { Actions } from '~/molecules/CombatantRow/components/Actions';

export interface CombatantRowProps {
  displayName: string;
  initiative: number;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  isSelected: boolean;
  isHidden: boolean;
  /** Whose turn it is right now. */
  isActive: boolean;
  isDelayed: boolean;
  conditions: ReadonlyArray<AppliedConditionSummary>;
  onSelect: () => void;
  onToggleDelay: () => void;
  onRemove: () => void;
  onOpenHitPoints: () => void;
}

/**
 * One line of the initiative order: initiative, name, hit points, AC.
 *
 * The row is a plain container with the select action on its own button. It
 * used to be a button wrapping the whole line, which nested the remove control
 * inside another control — invalid HTML, and unreachable by keyboard.
 */
export const CombatantRow = ({
  displayName,
  initiative,
  currentHitPoints,
  maxHitPoints,
  temporaryHitPoints,
  armorClass,
  isSelected,
  isHidden,
  isActive,
  isDelayed,
  conditions,
  onSelect,
  onToggleDelay,
  onRemove,
  onOpenHitPoints,
}: CombatantRowProps) => {
  const tone = toHitPointTone({ currentHitPoints, maxHitPoints });

  const isDown = tone === 'down';

  return (
    <Row $isSelected={isSelected} $isActive={isActive} $isDown={isDown}>
      <Initiative>{initiative}</Initiative>
      <SelectButton
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={`Select ${displayName}`}
      >
        {displayName}
        {isActive && <Badge $tone="active">turn</Badge>}
        {isDown && (
          <Badge $tone="muted" title="Reduced to 0 hit points">
            down
          </Badge>
        )}
        {isDelayed && <Badge $tone="muted">delayed</Badge>}
        {isHidden && (
          <Badge $tone="muted" title="Hidden from the player view">
            hidden
          </Badge>
        )}
        <ConditionBadges conditions={conditions} />
      </SelectButton>
      <HitPointsButton
        type="button"
        $tone={tone}
        onClick={onOpenHitPoints}
        aria-label={`Edit hit points for ${displayName}`}
      >
        {currentHitPoints}/{maxHitPoints}
        {temporaryHitPoints > 0 && <Temporary>+{temporaryHitPoints}</Temporary>}
      </HitPointsButton>
      <MonoMuted>{armorClass}</MonoMuted>
      <Actions>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDelay}
          aria-label={
            isDelayed
              ? `Return ${displayName} to the order`
              : `Delay ${displayName}`
          }
        >
          {isDelayed ? '⏵' : '⏸'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove ${displayName}`}
        >
          ✕
        </Button>
      </Actions>
    </Row>
  );
};
