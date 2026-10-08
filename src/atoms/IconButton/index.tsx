'use client';

import styled, { css } from 'styled-components';

/** A square, icon-only button that lights up while its tool is active. */
export const IconButton = styled.button<{ $isActive: boolean }>`
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: ${props => props.theme.borderWidth('s')} solid transparent;
  border-radius: ${props => props.theme.borderRadius('base')};
  background: transparent;
  color: ${props => props.theme.color('formBackground', 'text')};
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease,
    border-color 120ms ease;

  &:hover {
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
