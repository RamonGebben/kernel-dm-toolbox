'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { toHitPointTone, type HitPointTone } from '~/utils/applyDamage';

export type CombatantRowProps = {
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
  onSelect: () => void;
  onToggleDelay: () => void;
  onRemove: () => void;
};

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
  onSelect,
  onToggleDelay,
  onRemove,
}: CombatantRowProps) => (
  <Row $isSelected={isSelected} $isActive={isActive}>
    <Initiative>{initiative}</Initiative>
    <SelectButton
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Select ${displayName}`}
    >
      {displayName}
      {isActive && <Badge $tone="active">turn</Badge>}
      {isDelayed && <Badge $tone="muted">delayed</Badge>}
      {isHidden && (
        <Badge $tone="muted" title="Hidden from the player view">
          hidden
        </Badge>
      )}
    </SelectButton>
    <HitPoints $tone={toHitPointTone({ currentHitPoints, maxHitPoints })}>
      {currentHitPoints}/{maxHitPoints}
      {temporaryHitPoints > 0 && <Temporary>+{temporaryHitPoints}</Temporary>}
    </HitPoints>
    <ArmorClass>{armorClass}</ArmorClass>
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

const toneColor = {
  full: (color: { success: string }) => color.success,
  damaged: (color: { warning: string }) => color.warning,
  down: (color: { danger: string }) => color.danger,
} as const;

const Row = styled.div<{ $isSelected: boolean; $isActive: boolean }>`
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 5.5rem 3rem 2.5rem;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  width: 100%;
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  background: ${props =>
    props.$isSelected
      ? props.theme.color.surfaceRaised
      : props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isSelected ? props.theme.color.success : props.theme.color.border};
  /* Whose turn it is has to read from across the table, not on inspection. */
  border-left: 3px solid
    ${props => (props.$isActive ? props.theme.color.accent : 'transparent')};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.md};

  &:hover {
    border-color: ${props => props.theme.color.accent};
    /* Hover must not paint a turn marker on a row whose turn it is not. */
    border-left-color: ${props =>
      props.$isActive ? props.theme.color.accent : 'transparent'};
  }
`;

const Initiative = styled.span`
  font-family: ${props => props.theme.font.mono};
  font-weight: 700;
  color: ${props => props.theme.color.textPrimary};
`;

const SelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  min-width: 0;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span<{ $tone: 'active' | 'muted' }>`
  flex-shrink: 0;
  padding: 0 ${props => props.theme.space.xs};
  border: 1px solid
    ${props =>
      props.$tone === 'active'
        ? props.theme.color.accent
        : props.theme.color.accentMuted};
  border-radius: ${props => props.theme.radius.pill};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props =>
    props.$tone === 'active'
      ? props.theme.color.accent
      : props.theme.color.textMuted};
`;

const HitPoints = styled.span<{ $tone: HitPointTone }>`
  font-family: ${props => props.theme.font.mono};
  color: ${props => toneColor[props.$tone](props.theme.color)};
`;

const Temporary = styled.span`
  margin-left: ${props => props.theme.space.xs};
  color: ${props => props.theme.color.accent};
`;

const ArmorClass = styled.span`
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.span`
  display: flex;
  justify-content: flex-end;
`;
