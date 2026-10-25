'use client';

import styled from 'styled-components';
import {
  RAIL_WIDTH,
  OVERLAY_SURFACE,
} from '~/organisms/MapControlPanel/styleConstants';

export const Rail = styled.nav`
  position: absolute;
  top: ${props => props.theme.spacing('base')};
  left: ${props => props.theme.spacing('base')};
  z-index: ${props => props.theme.zIndex('sticky')};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing('xs')};
  width: ${RAIL_WIDTH};
  padding: ${props => props.theme.spacing('xs')};
  border-radius: 16px;
  ${OVERLAY_SURFACE}
`;
