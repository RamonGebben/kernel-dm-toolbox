'use client';

import styled from 'styled-components';

export const Balance = styled.p`
  margin: 0;
  font-family: ${props => props.theme.fontFamily('mono')};
  font-size: ${props => props.theme.fontSize('l')};
  color: ${props => props.theme.color('background', 'text')};
`;
