'use client';

import styled from 'styled-components';

export const Row = styled.li<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: ${props =>
    props.$isActive
      ? props.theme.color('formBackground')
      : props.theme.color('background', 'emphasis')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isActive
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-left-width: ${props => (props.$isActive ? '4px' : '1px')};
  border-radius: ${props => props.theme.borderRadius('s')};
  font-size: ${props => props.theme.fontSize('s')};
`;
