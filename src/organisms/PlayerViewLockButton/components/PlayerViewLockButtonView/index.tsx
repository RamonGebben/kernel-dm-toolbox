'use client';

import styled, { css } from 'styled-components';
import { Icon } from '~/atoms/Icon';

export type PlayerViewLockButtonViewProps = {
  isLocked: boolean;
  onToggle: () => void;
};

/**
 * A single-purpose toggle, styled to match the map control rail's other
 * icon buttons — it lives directly in the rail rather than behind a drawer
 * section, since locking the player view lens against drags is one instant
 * action, not a settings panel to open.
 */
export const PlayerViewLockButtonView = ({
  isLocked,
  onToggle,
}: PlayerViewLockButtonViewProps) => (
  <Button
    type="button"
    $isActive={isLocked}
    aria-pressed={isLocked}
    aria-label={isLocked ? 'Unlock player view' : 'Lock player view'}
    title={isLocked ? 'Unlock player view' : 'Lock player view'}
    onClick={onToggle}
  >
    <Icon name={isLocked ? 'lock' : 'unlock'} size="1.25rem" />
  </Button>
);

const Button = styled.button<{ $isActive: boolean }>`
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: ${props => props.theme.radius.md};
  background: transparent;
  color: ${props => props.theme.color.textMuted};
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease,
    border-color 120ms ease;

  &:hover {
    color: ${props => props.theme.color.textPrimary};
    background: ${props => props.theme.color.surfaceRaised};
  }

  ${props =>
    props.$isActive &&
    css`
      color: ${props.theme.color.accent};
      border-color: ${props.theme.color.accentMuted};
      background: ${props.theme.color.surfaceRaised};
    `}
`;
