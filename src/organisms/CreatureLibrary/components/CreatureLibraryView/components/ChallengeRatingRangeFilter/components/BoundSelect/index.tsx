'use client';

import styled from 'styled-components';

export const BoundSelect = styled.select`
  flex: 1;
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('background', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('s')};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.color('primary')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: ${props => props.theme.color('background')};
  }
`;
