'use client';

import styled from 'styled-components';

export const Grid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${props => props.$columns ?? 4},
    minmax(0, 1fr)
  );
  gap: ${props => props.theme.spacing('s')};
`;
