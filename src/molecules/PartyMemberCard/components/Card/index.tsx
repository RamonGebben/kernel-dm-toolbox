'use client';

import styled from 'styled-components';

export const Card = styled.article<{ $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('base')};
  background: ${props => props.theme.color('background')};
  /* Benched reads as a dashed outline, not dimmed text — fading the text
   * would drop muted copy below AA contrast. */
  border: ${props => props.theme.borderWidth('s')}
    ${props => (props.$isActive ? 'solid' : 'dashed')}
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
