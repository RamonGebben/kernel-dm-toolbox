'use client';

import { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useCanvasSize } from '~/organisms/MapCanvas/hooks/useCanvasSize';
import type { BattleSnapshotCombatant } from '~/utils/deriveBattleSnapshot';

export type BattleCanvasProps = {
  cols?: number;
  rows?: number;
  combatants: readonly BattleSnapshotCombatant[];
  /** Ids involved in the most recently revealed log entry — drawn with a
   * brief highlight ring, the canvas's only concession to "something just
   * happened here" (no spell-effect video playback, per issue #5's scope —
   * that machinery belongs to a placed shape on the Maps tool, not this
   * much simpler combat feedback). */
  highlightedCombatantIds: readonly string[];
};

const CELL_SIZE = 34;
/** Matches `PlacementGrid`'s own plain-value treatment for the same reason:
 * canvas 2D fillStyle/strokeStyle need resolved colour strings, not a CSS
 * custom property reference. */
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.12)';
const GRID_BACKGROUND = 'rgba(255, 255, 255, 0.03)';
const PARTY_COLOR = '#6fa7ff';
const MONSTER_COLOR = '#ff6f6f';
const DEFEATED_COLOR = 'rgba(255, 255, 255, 0.18)';
const HIGHLIGHT_COLOR = 'rgba(255, 255, 255, 0.9)';
const HP_BAR_BACKGROUND = 'rgba(0, 0, 0, 0.5)';
const HP_BAR_FILL = '#6fdc8c';
const HP_BAR_FILL_LOW = '#ff6f6f';

/**
 * Presentational: draws the current battle snapshot — a token per combatant,
 * greyed out once defeated, with a thin HP bar — on the same static-grid
 * canvas shape `PlacementGrid` already established (issue #5, milestone 3),
 * reusing `useCanvasSize` for backing-store sizing. Redraws through a single
 * `requestAnimationFrame` per prop change, same scheduling discipline.
 */
export const BattleCanvas = ({
  cols = 14,
  rows = 10,
  combatants,
  highlightedCombatantIds,
}: BattleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const highlighted = new Set(highlightedCombatantIds);

    for (const combatant of combatants) {
      const centerX = combatant.position.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = combatant.position.y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 4;

      if (highlighted.has(combatant.id)) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = HIGHLIGHT_COLOR;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = combatant.isDefeated ? 0.4 : 1;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = combatant.isDefeated
        ? DEFEATED_COLOR
        : combatant.side === 'party'
          ? PARTY_COLOR
          : MONSTER_COLOR;
      ctx.fill();

      ctx.fillStyle = '#0a0a0a';
      ctx.font = '600 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(combatant.name.slice(0, 2).toUpperCase(), centerX, centerY);

      const hpRatio =
        combatant.maxHitPoints > 0
          ? combatant.currentHitPoints / combatant.maxHitPoints
          : 0;
      const barWidth = CELL_SIZE - 8;
      const barX = centerX - barWidth / 2;
      const barY = centerY + radius + 3;

      ctx.fillStyle = HP_BAR_BACKGROUND;
      ctx.fillRect(barX, barY, barWidth, 3);
      ctx.fillStyle = hpRatio <= 0.25 ? HP_BAR_FILL_LOW : HP_BAR_FILL;
      ctx.fillRect(barX, barY, barWidth * Math.max(0, hpRatio), 3);

      ctx.globalAlpha = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatants, highlightedCombatantIds, cols, rows]);

  useEffect(() => {
    drawRef.current = draw;
    requestAnimationFrame(draw);
  }, [draw]);

  return (
    <Wrapper>
      <Canvas
        ref={canvasRef}
        style={{ width: cols * CELL_SIZE, height: rows * CELL_SIZE }}
        role="img"
        aria-label="Battle grid"
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  overflow: auto;
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Canvas = styled.canvas`
  display: block;
`;
