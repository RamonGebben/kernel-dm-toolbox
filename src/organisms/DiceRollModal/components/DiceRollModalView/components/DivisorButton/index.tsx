'use client';

import styled from 'styled-components';

export const DivisorButton = styled.button<{ $isActive: boolean }>`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  background: ${props =>
    props.$isActive ? props.theme.color('primary') : 'transparent'};
  color: ${props =>
    props.$isActive
      ? props.theme.color('primary', 'text')
      : props.theme.color('formBackground', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('s')};
  cursor: pointer;

  &:hover {
    color: ${props =>
      props.$isActive
        ? props.theme.color('primary', 'text')
        : props.theme.color('background', 'text')};
  }
`;
