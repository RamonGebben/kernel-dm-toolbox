'use client';

import styled from 'styled-components';

export const FullScreen = styled.div`
  position: relative;
  /* Fills its parent frame rather than the physical viewport — under a 90°
   * orientation override the parent's own box no longer matches 100dvh. */
  width: 100%;
  height: 100%;
`;
