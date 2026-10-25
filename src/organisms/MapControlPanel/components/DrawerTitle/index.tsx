'use client';

import styled from 'styled-components';

export const DrawerTitle = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize('base')};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color('background', 'text')};
`;
