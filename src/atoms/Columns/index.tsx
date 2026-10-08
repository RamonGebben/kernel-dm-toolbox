'use client';

import styled from 'styled-components';

/**
 * A template's panels: stacked on a tablet, where each panel scrolls within
 * a readable height, and side by side in the given `$columns` from tablet
 * landscape up.
 */
export const Columns = styled.div<{ $columns: string }>`
  display: grid;
  flex: 1;
  min-height: 0;
  gap: ${props => props.theme.spacing('base')};
  grid-template-columns: 1fr;
  grid-auto-rows: minmax(16rem, auto);
  overflow-y: auto;

  @media (min-width: ${props => props.theme.bp('tabletLandscape')}) {
    grid-template-columns: ${props => props.$columns};
    grid-auto-rows: unset;
    overflow-y: visible;
  }
`;
