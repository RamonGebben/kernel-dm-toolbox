'use client';

import styled from 'styled-components';

export const Workspace = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  padding: ${props => props.theme.spacing('base')};
  min-width: 0;
  min-height: 0;
`;
