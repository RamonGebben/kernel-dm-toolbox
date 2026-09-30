'use client';

import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export type PortalProps = {
  children: ReactNode;
};

/**
 * Renders `children` at the end of `document.body`, escaping any ancestor's
 * `overflow`/clip — for floating content (a dropdown, a dialog) that must
 * never be cut off, or force a scrollbar onto, a scrolling panel. `Modal`,
 * `FilterBar` and `MapRowMenu` all render through this rather than
 * inline.
 *
 * Guarded for the server: `document` doesn't exist there, and nothing here
 * needs to render before a browser has actually opened the thing.
 */
export const Portal = ({ children }: PortalProps) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};
