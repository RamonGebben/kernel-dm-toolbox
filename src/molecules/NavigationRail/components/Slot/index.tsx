'use client';

import styled, { css } from 'styled-components';

export const Slot = styled.a<{ $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing('xs')};
  width: 4rem;
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('xs')};
  border: ${props => props.theme.borderWidth('s')} solid transparent;
  border-radius: ${props => props.theme.borderRadius('s')};
  background: transparent;
  color: ${props => props.theme.color('formBackground', 'text')};
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    color: ${props => props.theme.color('background', 'text')};
    background: ${props => props.theme.color('formBackground')};
  }

  ${props =>
    props.$isActive &&
    css`
      color: ${props.theme.color('primary')};
      border-color: ${props.theme.color('secondary')};
      background: ${props.theme.color('formBackground')};
    `}
`;
