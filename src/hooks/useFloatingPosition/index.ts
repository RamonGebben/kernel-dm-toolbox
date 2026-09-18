'use client';

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export type FloatingAlign = 'start' | 'end';

export type FloatingPosition = {
  top: number;
  left: number;
};

export type FloatingAnchorRect = {
  bottom: number;
  left: number;
  right: number;
};

const VIEWPORT_MARGIN = 8;

/**
 * Where a portalled dropdown should sit given its trigger's own on-screen
 * rect — pure, so the browser-free unit project can test the alignment and
 * clamping math without a real DOM.
 *
 * `align: 'start'` anchors the dropdown's left edge to the trigger's left
 * edge (`MultiSelectFilter`'s old `left: 0`); `'end'` anchors the right
 * edges (`MapRowMenu`'s old `right: 0`). Either way the result is clamped to
 * stay on screen on both axes — a static `left`/`right`/`top` never
 * guaranteed that once the dropdown was free to overflow whatever used to
 * clip it, and a trigger near the bottom of the viewport (the last row of a
 * long, scrolled list) would otherwise place the menu partly or fully below
 * the visible area with no ancestor scroll left to reach it.
 */
export const computeFloatingPosition = ({
  anchorRect,
  menuWidth,
  menuHeight,
  viewportWidth,
  viewportHeight,
  align,
  gap,
}: {
  anchorRect: FloatingAnchorRect;
  menuWidth: number;
  menuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  align: FloatingAlign;
  gap: number;
}): FloatingPosition => {
  const rawLeft =
    align === 'start' ? anchorRect.left : anchorRect.right - menuWidth;
  const maxLeft = Math.max(
    VIEWPORT_MARGIN,
    viewportWidth - menuWidth - VIEWPORT_MARGIN,
  );
  const rawTop = anchorRect.bottom + gap;
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    viewportHeight - menuHeight - VIEWPORT_MARGIN,
  );

  return {
    top: Math.min(Math.max(rawTop, VIEWPORT_MARGIN), maxTop),
    left: Math.min(Math.max(rawLeft, VIEWPORT_MARGIN), maxLeft),
  };
};

/** `useLayoutEffect` warns when it runs during server rendering; `useEffect`
 * there is equally a no-op — nothing here can measure a real trigger before
 * a browser has opened the menu regardless — but silent. */
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** `0.25rem` in px, read from the root so the gap tracks whatever
 * `theme.space.xs` actually resolves to rather than a hardcoded pixel
 * count. */
const gapPx = () =>
  0.25 * parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * Positions a portalled dropdown against its still-inline trigger. A portal
 * to `document.body` moves the dropdown out of its trigger's normal flow, so
 * `position: absolute` relative to the trigger no longer works once the two
 * don't share a DOM parent — this computes `position: fixed` coordinates
 * instead, via `computeFloatingPosition`.
 *
 * Recomputed on open, and kept in sync with any ancestor's scroll (`capture:
 * true`, since `scroll` doesn't bubble) or a window resize while open.
 * `useLayoutEffect` (not `useEffect`) so the very first measured position
 * commits before the browser paints — otherwise the dropdown would flash at
 * its unmeasured default for one frame.
 */
export const useFloatingPosition = (
  isOpen: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
  align: FloatingAlign,
): FloatingPosition | null => {
  const [position, setPosition] = useState<FloatingPosition | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const gap = gapPx();

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const menuRect = menuRef.current?.getBoundingClientRect();

      setPosition(
        computeFloatingPosition({
          anchorRect: trigger.getBoundingClientRect(),
          menuWidth: menuRect?.width ?? 0,
          menuHeight: menuRect?.height ?? 0,
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: document.documentElement.clientHeight,
          align,
          gap,
        }),
      );
    };

    // rAF-throttled: `scroll` (capture-phase, since it doesn't bubble) and
    // `resize` can both fire many times per second (trackpad momentum
    // scroll, a drag-resize), and each raw event would otherwise force a
    // synchronous layout read (`getBoundingClientRect`) plus a React state
    // update — batching to at most once per animation frame is the same
    // "don't write per raw event" rule the map canvas's own scheduler
    // follows.
    let frame: number | null = null;
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        update();
      });
    };

    update();
    document.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [isOpen, align, triggerRef, menuRef]);

  return position;
};
