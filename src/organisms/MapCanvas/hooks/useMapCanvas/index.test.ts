import { describe, expect, it } from 'vitest';
import { computeGridCalibration } from '~/organisms/MapCanvas/hooks/useMapCanvas';

describe('computeGridCalibration', () => {
  it('uses the larger of width/height as a square cell size', () => {
    const result = computeGridCalibration({ x: 0, y: 0 }, { x: 40, y: 70 });

    expect(result.gridCellSize).toBe(70);
  });

  it('anchors the origin at the top-left corner regardless of drag direction', () => {
    const result = computeGridCalibration({ x: 100, y: 100 }, { x: 40, y: 60 });

    expect(result.gridOriginX).toBe(40);
    expect(result.gridOriginY).toBe(60);
  });

  it('never returns a cell smaller than 4px, so a near-zero drag cannot zero-divide later', () => {
    const result = computeGridCalibration({ x: 10, y: 10 }, { x: 11, y: 10 });

    expect(result.gridCellSize).toBe(4);
  });
});
