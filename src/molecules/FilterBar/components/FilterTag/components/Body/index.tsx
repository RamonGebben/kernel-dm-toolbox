'use client';

import styled from 'styled-components';

export const Body = styled.button`
  overflow: hidden;
  padding: ${props => props.theme.spacing('xs')} 0
    ${props => props.theme.spacing('xs')} ${props => props.theme.spacing('s')};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.borderRadius('full')} 0 0
    ${props => props.theme.borderRadius('full')};
  color: ${props => props.theme.color('background', 'text')};
  font-family: inherit;
  font-size: inherit;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;
