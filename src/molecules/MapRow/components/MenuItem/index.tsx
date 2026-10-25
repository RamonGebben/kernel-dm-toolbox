'use client';

import styled from 'styled-components';

export const MenuItem = styled.button<{ $isDanger?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props =>
    props.$isDanger
      ? props.theme.color('error')
      : props.theme.color('background', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('s')};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.color('background', 'emphasis')};
  }

  &[aria-pressed='true'] {
    color: ${props => props.theme.color('primary')};
    font-weight: ${props => props.theme.fontWeight('semibold')};
  }
`;
