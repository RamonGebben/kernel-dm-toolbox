'use client';

import styled from 'styled-components';
import type { SystemSize } from '@pindakaasman/design-system';

/** A vertical run of children with one gap between them. */
export const Stack = styled.div<{ $gap?: SystemSize }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing(props.$gap ?? 'base')};
`;
