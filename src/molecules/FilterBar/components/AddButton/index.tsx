'use client';

import styled from 'styled-components';

export const AddButton = styled.button`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: transparent;
  border: ${props => props.theme.borderWidth('s')} dashed
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('full')};
  color: ${props => props.theme.color('formBackground', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('s')};
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.color('primary')};
    color: ${props => props.theme.color('background', 'text')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
