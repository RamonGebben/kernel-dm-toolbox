'use client';

import styled from 'styled-components';

/** A row that pushes its first and last child to opposite ends. */
export const SpreadRow = styled.div<{ $align?: 'center' | 'flex-start' }>`
  display: flex;
  align-items: ${props => props.$align ?? 'center'};
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
`;
