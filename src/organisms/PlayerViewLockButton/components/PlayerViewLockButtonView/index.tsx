'use client';

import { Icon } from '~/atoms/Icon';
import { IconButton } from '~/atoms/IconButton';

export interface PlayerViewLockButtonViewProps {
  isLocked: boolean;
  onToggle: () => void;
}

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
  <IconButton
    type="button"
    $isActive={isLocked}
    aria-pressed={isLocked}
    aria-label={isLocked ? 'Unlock player view' : 'Lock player view'}
    title={isLocked ? 'Unlock player view' : 'Lock player view'}
    onClick={onToggle}
  >
    <Icon name={isLocked ? 'lock' : 'unlock'} size="1.25rem" />
  </IconButton>
);
