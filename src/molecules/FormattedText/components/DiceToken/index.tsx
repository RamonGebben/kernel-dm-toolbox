'use client';

import styled from 'styled-components';

export const DiceToken = styled.button`
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: ${props => props.theme.color('primary')};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color('primary', 'emphasis')};
  }
`;
