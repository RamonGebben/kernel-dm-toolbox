'use client';

import styled from 'styled-components';

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};

  @media (min-width: ${props => props.theme.bp('tablet')}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;
