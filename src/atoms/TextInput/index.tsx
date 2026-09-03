'use client';

import styled from 'styled-components';
import type { InputHTMLAttributes } from 'react';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = (props: TextInputProps) => (
  <StyledInput type="text" {...props} />
);

const StyledInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};

  &::placeholder {
    color: ${props => props.theme.color.textMuted};
  }
`;
