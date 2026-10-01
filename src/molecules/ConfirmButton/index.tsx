'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';

export type ConfirmButtonProps = {
  /** The first button: it only asks. */
  label: string;
  /** The second button: it does the thing. */
  confirmLabel: string;
  /** Accessible name for the first button, when `label` alone is ambiguous. */
  ariaLabel?: string;
  disabled?: boolean;
  onConfirm: () => void;
};

/**
 * A destructive action behind a second click, inline rather than in a
 * dialog: the first click swaps the button for "confirm / keep".
 */
export const ConfirmButton = ({
  label,
  confirmLabel,
  ariaLabel,
  disabled = false,
  onConfirm,
}: ConfirmButtonProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={() => setIsConfirming(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <Group>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => {
          setIsConfirming(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsConfirming(false)}>
        Keep
      </Button>
    </Group>
  );
};

const Group = styled.span`
  display: inline-flex;
  gap: ${props => props.theme.space.xs};
`;
