'use client';

import styled from 'styled-components';
import type { SystemSize } from '@pindakaasman/design-system';

/** A horizontal run of children with one gap between them. */
export const Cluster = styled.div<{ $gap?: SystemSize }>`
  display: flex;
  gap: ${props => props.theme.spacing(props.$gap ?? 's')};
`;
