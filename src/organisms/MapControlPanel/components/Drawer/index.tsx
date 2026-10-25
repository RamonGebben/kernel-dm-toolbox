'use client';

import styled, { css } from 'styled-components';
import {
  RAIL_WIDTH,
  OVERLAY_SURFACE,
} from '~/organisms/MapControlPanel/styleConstants';

export const Drawer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: ${props => props.theme.spacing('base')};
  left: calc(${RAIL_WIDTH} + ${props => props.theme.spacing('base')} * 2);
  z-index: ${props => props.theme.zIndex('sticky')};
  display: flex;
  flex-direction: column;
  width: min(
    22rem,
    calc(100% - ${RAIL_WIDTH} - ${props => props.theme.spacing('base')} * 3)
  );
  max-height: calc(100% - ${props => props.theme.spacing('base')} * 2);
  border-radius: 16px;
  ${OVERLAY_SURFACE}

  transition:
    opacity 160ms ease,
    transform 160ms ease;

  ${props =>
    props.$isOpen
      ? css`
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        `
      : css`
          opacity: 0;
          transform: translateX(-8px);
          pointer-events: none;
        `}
`;
