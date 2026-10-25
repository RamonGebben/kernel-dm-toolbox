'use client';

import styled from 'styled-components';

export const Body = styled.div<{ $isScrollable: boolean }>`
  flex: 1;
  min-height: 0;
  overflow-y: ${props => (props.$isScrollable ? 'auto' : 'hidden')};
  padding: ${props => props.theme.spacing('base')};
`;
