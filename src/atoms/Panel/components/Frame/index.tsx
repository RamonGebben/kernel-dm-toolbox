'use client';

import styled from 'styled-components';

export const Frame = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex-basis: 100%;
  background: ${props => props.theme.color('background', 'emphasis')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-top: ${props => props.theme.borderWidth('base')} solid
    ${props => props.theme.color('primary')};
  border-radius: ${props => props.theme.borderRadius('base')};
  overflow: hidden;
`;
