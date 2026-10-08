'use client';

import styled from 'styled-components';

export const MenuItem = styled.button`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('background', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('s')};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${props => props.theme.color('background')};
    color: ${props => props.theme.color('primary')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
