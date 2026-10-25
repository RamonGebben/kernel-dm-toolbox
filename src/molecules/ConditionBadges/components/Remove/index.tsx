'use client';

import styled from 'styled-components';

export const Remove = styled.button`
  padding: 0;
  background: none;
  border: none;
  color: ${props => props.theme.color('formBackground', 'text')};
  font: inherit;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color('background', 'text')};
  }
`;
