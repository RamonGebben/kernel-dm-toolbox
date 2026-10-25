'use client';

import styled from 'styled-components';

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  max-height: 16rem;
  overflow-y: auto;
`;
