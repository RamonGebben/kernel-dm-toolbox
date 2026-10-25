'use client';

import styled from 'styled-components';

/** The part of a flex column that scrolls while its siblings stay put. */
export const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;
