'use client';

import styled from 'styled-components';

export const ShapeSelectButton = styled.button`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: ${props => props.theme.spacing('s')};
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: ${props => props.theme.borderWidth('base')} solid
      ${props => props.theme.color('primary')};
    outline-offset: 2px;
  }
`;
