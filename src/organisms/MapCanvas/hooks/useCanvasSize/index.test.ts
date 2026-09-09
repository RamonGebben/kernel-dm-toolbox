import { describe, expect, it } from 'vitest';
import {
  MAX_DEVICE_PIXEL_RATIO,
  clampDevicePixelRatio,
  toDevicePixelSize,
} from '~/organisms/MapCanvas/hooks/useCanvasSize';

describe('clampDevicePixelRatio', () => {
  it('passes a normal ratio through unchanged', () => {
    expect(clampDevicePixelRatio(1)).toBe(1);
    expect(clampDevicePixelRatio(2)).toBe(2);
  });

  it('caps a high-DPI ratio at the maximum', () => {
    expect(clampDevicePixelRatio(3)).toBe(MAX_DEVICE_PIXEL_RATIO);
  });
});

describe('toDevicePixelSize', () => {
  it('scales width and height by the ratio', () => {
    expect(toDevicePixelSize({ width: 800, height: 600 }, 2)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it('rounds fractional CSS sizes to whole device pixels', () => {
    expect(toDevicePixelSize({ width: 800.4, height: 600.6 }, 1)).toEqual({
      width: 800,
      height: 601,
    });
  });
});
