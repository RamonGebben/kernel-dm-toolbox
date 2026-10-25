'use client';

import styled, { css } from 'styled-components';
import type { ButtonVariant, ButtonSize } from '~/atoms/Button';

const variantStyles = {
  primary: css`
    background: ${props => props.theme.gradient('hero')};
    color: ${props => props.theme.color('primary', 'text')};
    border-color: transparent;

    &:hover:not(:disabled) {
      background: ${props => props.theme.color('primary', 'emphasis')};
    }
  `,
  secondary: css`
    background: ${props => props.theme.color('formBackground')};
    color: ${props => props.theme.color('background', 'text')};
    border-color: ${props => props.theme.color('formBackground', 'emphasis')};

    &:hover:not(:disabled) {
      border-color: ${props => props.theme.color('primary')};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${props => props.theme.color('formBackground', 'text')};
    border-color: transparent;

    &:hover:not(:disabled) {
      color: ${props => props.theme.color('background', 'text')};
      background: ${props => props.theme.color('background', 'emphasis')};
    }
  `,
} as const satisfies Record<ButtonVariant, ReturnType<typeof css>>;

const sizeStyles = {
  sm: css`
    padding: ${props => props.theme.spacing('xs')}
      ${props => props.theme.spacing('s')};
    font-size: ${props => props.theme.fontSize('s')};
  `,
  md: css`
    padding: ${props => props.theme.spacing('s')}
      ${props => props.theme.spacing('m')};
    font-size: ${props => props.theme.fontSize('base')};
  `,
} as const satisfies Record<ButtonSize, ReturnType<typeof css>>;

export const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $isFullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing('s')};
  width: ${props => (props.$isFullWidth ? '100%' : 'auto')};
  border: ${props => props.theme.borderWidth('s')} solid;
  border-radius: ${props => props.theme.borderRadius('base')};
  font-family: inherit;
  font-weight: ${props => props.theme.fontWeight('semibold')};
  line-height: ${props => props.theme.lineHeight('tight')};
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
