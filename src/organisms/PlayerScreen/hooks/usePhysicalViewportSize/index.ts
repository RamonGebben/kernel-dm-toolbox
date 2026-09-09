'use client';

import { useEffect, useState } from 'react';
import type { PhysicalSize } from '~/utils/screenOrientation';

/** Matches `mapSessions`' own `playerScreenWidth/Height` defaults, so the
 * frame is sane before the first `resize` fires (including during SSR, where
 * `window` doesn't exist yet). */
const DEFAULT_SIZE: PhysicalSize = { width: 1920, height: 1080 };

/**
 * The player screen's own actual (pre-rotation) viewport size — what
 * `PlayerScreenStage` rotates around. Distinct from `playerScreenWidth/Height`
 * on the session, which is the *post-rotation* size reported for lens math.
 */
export const usePhysicalViewportSize = (): PhysicalSize => {
  const [size, setSize] = useState<PhysicalSize>(DEFAULT_SIZE);

  useEffect(() => {
    const updateSize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  return size;
};
