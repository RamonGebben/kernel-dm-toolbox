'use client';

import styled from 'styled-components';

export const Panel = styled.div<{ $isWide: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${props => (props.$isWide ? 'min(64rem, 100%)' : 'min(32rem, 100%)')};
  max-height: min(40rem, 90dvh);
  background: ${props => props.theme.color('background', 'emphasis')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-top: ${props => props.theme.borderWidth('base')} solid
    ${props => props.theme.color('primary')};
  border-radius: ${props => props.theme.borderRadius('base')};
  box-shadow: ${props => props.theme.boxShadow('card')};
  transition: width 0.25s ease;

  &:focus {
    outline: none;
  }
`;
