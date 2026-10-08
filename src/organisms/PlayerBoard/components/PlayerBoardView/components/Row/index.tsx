'use client';

import styled from 'styled-components';

export const Row = styled.li<{ $isActive: boolean }>`
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: ${props => props.theme.spacing('base')};
  padding: ${props => props.theme.spacing('base')};
  background: ${props =>
    props.$isActive
      ? props.theme.color('formBackground')
      : props.theme.color('background', 'emphasis')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isActive
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-left-width: ${props => (props.$isActive ? '6px' : '1px')};
  border-radius: ${props => props.theme.borderRadius('base')};
  font-size: 1.5rem;
`;
