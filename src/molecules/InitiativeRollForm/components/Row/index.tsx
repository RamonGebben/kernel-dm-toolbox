'use client';

import styled from 'styled-components';

export const Row = styled.div`
  display: grid;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  grid-template-columns: minmax(0, 1fr) 6rem;
  padding: ${props => props.theme.spacing('xs')} 0;
`;
