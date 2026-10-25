'use client';

import styled from 'styled-components';

export const AbilityScore = styled.dd`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  font-family: ${props => props.theme.fontFamily('mono')};
  color: ${props => props.theme.color('background', 'text')};
`;
