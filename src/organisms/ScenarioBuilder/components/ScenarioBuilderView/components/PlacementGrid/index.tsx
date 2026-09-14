'use client';

import { useCallback, useEffect, useRef, type MouseEvent } from 'react';
import styled from 'styled-components';
import { useCanvasSize } from '~/organisms/MapCanvas/hooks/useCanvasSize';

export type PlacementGridCell = { x: number; y: number };

export type PlacementGridToken = {
  key: string;
  /** A one or two character initial drawn inside the token's dot. */
  label: string;
  color: string;
  position: PlacementGridCell | null;
};

export type PlacementGridProps = {
  /** Grid extent in cells. Abstract, not tied to any uploaded map — this is
   * a scenario's deployment grid, not a battle map. */
  cols?: number;
  rows?: number;
  tokens: readonly PlacementGridToken[];
  /** The token the next cell click places, if any. */
  armedKey: string | null;
  onPlaceCell: (cell: PlacementGridCell) => void;
};

const CELL_SIZE = 34;
/** Canvas 2D fillStyle/strokeStyle need resolved color strings — a CSS custom
 * property reference doesn't work here the way it would in styled-components
 * output, so these are plain values rather than `props.theme.color.*`, the
 * same treatment `MapCanvasView`'s own grid/fog colors get. */
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.12)';
const GRID_BACKGROUND = 'rgba(255, 255, 255, 0.03)';
const ARMED_RING_COLOR = 'rgba(255, 255, 255, 0.9)';

/**
 * Presentational: a plain, un-zoomed grid a DM clicks to place a party
 * member or monster-group token for a simulator scenario (issue #5,
 * milestone 3).
 *
 * Deliberately its own small component rather than `MapCanvasView` reused
 * wholesale — that component's prop surface (uploaded media, fog of war,
 * calibration, live-measurement broadcast) exists for an actual battle map
 * with pan/zoom, none of which applies to a scenario's static deployment
 * grid. What genuinely is reused is `useCanvasSize`, the same
 * device-pixel-ratio-capped backing-store sizing every other canvas in this
 * app uses. The draw itself still goes through a single `requestAnimationFrame`
 * per change rather than synchronously in the effect body, mirroring
 * `MapCanvasView`'s scheduling discipline — but there is no persistent
 * ref-based scheduler here, since nothing about this grid redraws more than
 * once per prop change; it has no continuous drag/zoom input stream to
 * batch against.
 */
export const PlacementGrid = ({
  cols = 14,
  rows = 10,
  tokens,
  armedKey,
  onPlaceCell,
}: PlacementGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Indirection so `useCanvasSize`'s resize callback can always reach the
   * latest `draw` without `draw` itself needing to exist before `sizeRef`
   * does — the two are mutually dependent (`draw` reads `sizeRef.current`,
   * `useCanvasSize` calls back into `draw` on resize). */
  const drawRef = useRef<() => void>(() => {});

  const sizeRef = useCanvasSize(canvasRef, () => {
    requestAnimationFrame(() => drawRef.current());
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = sizeRef.current.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sizeRef.current.width, sizeRef.current.height);

    ctx.fillStyle = GRID_BACKGROUND;
    ctx.fillRect(0, 0, cols * CELL_SIZE, rows * CELL_SIZE);

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let col = 0; col <= cols; col += 1) {
      ctx.beginPath();
      ctx.moveTo(col * CELL_SIZE + 0.5, 0);
      ctx.lineTo(col * CELL_SIZE + 0.5, rows * CELL_SIZE);
      ctx.stroke();
    }
    for (let row = 0; row <= rows; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL_SIZE + 0.5);
      ctx.lineTo(cols * CELL_SIZE, row * CELL_SIZE + 0.5);
      ctx.stroke();
    }

    for (const token of tokens) {
      if (!token.position) continue;

      const centerX = token.position.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = token.position.y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 4;

      if (token.key === armedKey) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = ARMED_RING_COLOR;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color;
      ctx.fill();

      ctx.fillStyle = '#0a0a0a';
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.label.slice(0, 2).toUpperCase(), centerX, centerY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, armedKey, cols, rows]);

  useEffect(() => {
    drawRef.current = draw;
    requestAnimationFrame(draw);
  }, [draw]);

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.min(
      cols - 1,
      Math.max(0, Math.floor((event.clientX - rect.left) / CELL_SIZE)),
    );
    const y = Math.min(
      rows - 1,
      Math.max(0, Math.floor((event.clientY - rect.top) / CELL_SIZE)),
    );

    onPlaceCell({ x, y });
  };

  return (
    <Wrapper>
      <Canvas
        ref={canvasRef}
        onClick={handleClick}
        $isArmed={armedKey !== null}
        style={{ width: cols * CELL_SIZE, height: rows * CELL_SIZE }}
        role="img"
        aria-label="Scenario deployment grid"
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  overflow: auto;
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Canvas = styled.canvas<{ $isArmed: boolean }>`
  display: block;
  cursor: ${props => (props.$isArmed ? 'crosshair' : 'default')};
`;
