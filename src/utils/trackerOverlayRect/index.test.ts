import { describe, expect, it } from 'vitest';
import {
  computeTrackerBoxFraction,
  trackerFootprint,
} from '~/utils/trackerOverlayRect';

describe('trackerFootprint', () => {
  it('scales linearly at moderate scale factors', () => {
    expect(trackerFootprint(1)).toEqual({
      widthFraction: 0.4,
      heightFraction: 0.38,
    });
    expect(trackerFootprint(0.5)).toEqual({
      widthFraction: 0.2,
      heightFraction: 0.19,
    });
  });

  it('clamps at the maximum footprint so it can never fill its container', () => {
    expect(trackerFootprint(3)).toEqual({
      widthFraction: 0.9,
      heightFraction: 0.9,
    });
  });
});

describe('computeTrackerBoxFraction', () => {
  it('flushes against the near edge at anchor 0', () => {
    expect(computeTrackerBoxFraction(0, 0, 1)).toEqual({
      left: 0,
      top: 0,
      width: 0.4,
      height: 0.38,
    });
  });

  it('flushes against the far edge at anchor 1, never overflowing', () => {
    const box = computeTrackerBoxFraction(1, 1, 1);

    expect(box.left + box.width).toBeCloseTo(1);
    expect(box.top + box.height).toBeCloseTo(1);
  });

  it('positions proportionally within the draggable remainder at a mid anchor', () => {
    const box = computeTrackerBoxFraction(0.5, 0.5, 1);

    expect(box.left).toBeCloseTo(0.3);
    expect(box.top).toBeCloseTo(0.31);
  });
});
