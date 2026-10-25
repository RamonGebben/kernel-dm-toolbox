'use client';

import styled from 'styled-components';

/** A vertical run of children that fills its container's height, so one
 * of them can scroll. */
export const FillStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  height: 100%;
  min-height: 0;
`;
