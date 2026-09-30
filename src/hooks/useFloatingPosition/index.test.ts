import { describe, expect, it } from 'vitest';
import { computeFloatingPosition } from '~/hooks/useFloatingPosition';

const anchorRect = { left: 100, right: 180, bottom: 60 };

describe('computeFloatingPosition', () => {
  it('anchors the left edges together when aligned to start', () => {
    expect(
      computeFloatingPosition({
        anchorRect,
        menuWidth: 150,
        menuHeight: 200,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'start',
        gap: 4,
      }),
    ).toEqual({ top: 64, left: 100 });
  });

  it('anchors the right edges together when aligned to end', () => {
    expect(
      computeFloatingPosition({
        anchorRect,
        menuWidth: 150,
        menuHeight: 200,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'end',
        gap: 4,
      }),
    ).toEqual({ top: 64, left: 30 });
  });

  it('clamps to the left margin rather than sitting off the left edge', () => {
    expect(
      computeFloatingPosition({
        anchorRect,
        menuWidth: 300,
        menuHeight: 200,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'end',
        gap: 4,
      }).left,
    ).toBe(8);
  });

  it('clamps to the right margin rather than sitting off the right edge', () => {
    expect(
      computeFloatingPosition({
        anchorRect: { left: 950, right: 970, bottom: 60 },
        menuWidth: 200,
        menuHeight: 200,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'start',
        gap: 4,
      }).left,
    ).toBe(792);
  });

  it('sits below the trigger by the gap', () => {
    expect(
      computeFloatingPosition({
        anchorRect,
        menuWidth: 150,
        menuHeight: 200,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'start',
        gap: 10,
      }).top,
    ).toBe(70);
  });

  it('clamps to the bottom margin rather than overflowing the viewport', () => {
    expect(
      computeFloatingPosition({
        anchorRect: { left: 100, right: 180, bottom: 780 },
        menuWidth: 150,
        menuHeight: 200,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'start',
        gap: 4,
      }).top,
    ).toBe(592);
  });

  it('clamps to the top margin when the menu is taller than the viewport', () => {
    expect(
      computeFloatingPosition({
        anchorRect: { left: 100, right: 180, bottom: 780 },
        menuWidth: 150,
        menuHeight: 2000,
        viewportWidth: 1000,
        viewportHeight: 800,
        align: 'start',
        gap: 4,
      }).top,
    ).toBe(8);
  });
});
