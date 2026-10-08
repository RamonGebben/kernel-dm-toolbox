'use client';

import styled from 'styled-components';

export const Tab = styled.button<{ $isActive: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: ${props =>
    props.$isActive ? props.theme.color('primary') : 'transparent'};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isActive
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props =>
    props.$isActive
      ? props.theme.color('primary', 'text')
      : props.theme.color('formBackground', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  cursor: pointer;

  &:hover {
    color: ${props =>
      props.$isActive
        ? props.theme.color('primary', 'text')
        : props.theme.color('background', 'text')};
  }
`;
