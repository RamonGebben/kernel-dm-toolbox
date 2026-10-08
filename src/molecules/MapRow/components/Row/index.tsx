'use client';

import styled from 'styled-components';

export const Row = styled.div<{ $isLoaded: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isLoaded
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
