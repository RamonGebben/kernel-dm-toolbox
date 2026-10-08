'use client';

import styled from 'styled-components';

export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  /* Above FilterBar's Popover and MapRow's Menu (both on the dropdown layer)
   * — all three now portal to document.body as siblings, so a modal opened
   * while a dropdown/menu is still open must win on stacking order alone
   * rather than on whichever one happened to mount last. */
  z-index: ${props => props.theme.zIndex('modal')};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing('base')};
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color('background')} 60%, transparent)`};
`;
