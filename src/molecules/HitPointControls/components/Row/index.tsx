'use client';

import styled from 'styled-components';

export const Row = styled.div`
  display: grid;
  grid-template-columns: 4.5rem repeat(3, minmax(0, 1fr));
  gap: ${props => props.theme.spacing('xs')};
`;
