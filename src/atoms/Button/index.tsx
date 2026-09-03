'use client';

import styled, { css } from 'styled-components';
import type { ButtonHTMLAttributes } from 'react';

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
 * as a prop. Colours come from `props.theme.color.*` — never a hex literal.
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

const variantStyles = {
  primary: css`
    background: ${props => props.theme.gradient.ember};
    color: ${props => props.theme.color.textInverted};
    border-color: transparent;

    &:hover:not(:disabled) {
      background: ${props => props.theme.color.accentHover};
    }
  `,
  secondary: css`
    background: ${props => props.theme.color.surfaceRaised};
    color: ${props => props.theme.color.textPrimary};
    border-color: ${props => props.theme.color.border};

    &:hover:not(:disabled) {
      border-color: ${props => props.theme.color.accent};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${props => props.theme.color.textMuted};
    border-color: transparent;

    &:hover:not(:disabled) {
      color: ${props => props.theme.color.textPrimary};
      background: ${props => props.theme.color.surface};
    }
  `,
} as const satisfies Record<ButtonVariant, ReturnType<typeof css>>;

const sizeStyles = {
  sm: css`
    padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
    font-size: ${props => props.theme.fontSize.sm};
  `,
  md: css`
    padding: ${props => props.theme.space.sm} ${props => props.theme.space.lg};
    font-size: ${props => props.theme.fontSize.md};
  `,
} as const satisfies Record<ButtonSize, ReturnType<typeof css>>;

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $isFullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.space.sm};
  width: ${props => (props.$isFullWidth ? '100%' : 'auto')};
  border: 1px solid;
  border-radius: ${props => props.theme.radius.md};
  font-family: inherit;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => variantStyles[props.$variant]}
  ${props => sizeStyles[props.$size]}
`;
