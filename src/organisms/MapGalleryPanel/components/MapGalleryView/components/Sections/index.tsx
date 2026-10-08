'use client';

import styled from 'styled-components';

export const Sections = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  min-height: 0;
  overflow-y: auto;
`;
