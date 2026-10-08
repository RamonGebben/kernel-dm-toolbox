'use client';

import styled from 'styled-components';

export const Option = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  color: ${props => props.theme.color('background', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color('primary')};
  }
`;
