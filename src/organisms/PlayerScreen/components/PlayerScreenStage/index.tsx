'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import {
  computeOrientationFrame,
  type PhysicalSize,
  type PlayerScreenOrientationSetting,
} from '~/utils/screenOrientation';

export type PlayerScreenStageProps = {
  physicalSize: PhysicalSize;
  orientation: PlayerScreenOrientationSetting;
  children: ReactNode;
};

/**
 * Wraps the player screen's entire content (whichever `playerScreenMode` is
 * live) in a frame that's rotated 90° when the DM's orientation override
 * disagrees with the screen's actual physical shape — a TV that's been
 * turned on its side still needs its content the right way round. `Frame`
 * carries the *pre-rotation* box, sized so its rotated bounding box exactly
 * refills the physical viewport; `Stage` clips and letterboxes the rest.
 */
export const PlayerScreenStage = ({
  physicalSize,
  orientation,
  children,
}: PlayerScreenStageProps) => {
  const frame = computeOrientationFrame(physicalSize, orientation);

  return (
    <Stage>
      <Frame
        $rotationDeg={frame.rotationDeg}
        $width={frame.width}
        $height={frame.height}
      >
        {children}
      </Frame>
    </Stage>
  );
};

const Stage = styled.div`
  position: relative;
  width: 100dvw;
  height: 100dvh;
  overflow: hidden;
  background: ${props => props.theme.color.canvas};
`;

const Frame = styled.div<{
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
