'use client';

import styled from 'styled-components';

export const DrawerBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${props => props.theme.spacing('base')};
`;
