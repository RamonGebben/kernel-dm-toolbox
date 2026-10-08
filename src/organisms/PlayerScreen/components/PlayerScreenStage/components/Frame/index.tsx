'use client';

import styled from 'styled-components';

export const Frame = styled.div<{
  $rotationDeg: 0 | 90;
  $width: number;
  $height: number;
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  transform: translate(-50%, -50%) rotate(${props => props.$rotationDeg}deg);
`;
