'use client';

import type { ButtonHTMLAttributes } from 'react';
import { StyledButton } from '~/atoms/Button/components/StyledButton';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isFullWidth?: boolean;
};

/**
 * The canonical atom.
 *
 * Presentational only: no data fetching, no store access, every input arrives
 * as a prop. Colours come from `props.theme.color()` — never a hex literal.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  isFullWidth = false,
  type = 'button',
  children,
  ...buttonProps
}: ButtonProps) => (
  <StyledButton
    type={type}
    $variant={variant}
    $size={size}
    $isFullWidth={isFullWidth}
    {...buttonProps}
  >
    {children}
  </StyledButton>
);
