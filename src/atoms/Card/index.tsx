'use client';

import styled from 'styled-components';

/** A bordered, padded box holding a vertical run of children. */
export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('base')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
