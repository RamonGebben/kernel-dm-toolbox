'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';

/**
 * The icon set, as inline SVG.
 *
 * Inline rather than a sprite or an icon package: there are a handful of them,
 * they have to inherit `currentColor` so a nav item can light up with the
 * accent, and adding a dependency to draw three shapes is not a trade worth
 * making. Geometry follows Lucide's 24×24 stroked grid so a later swap to a
 * package is a rename rather than a redraw.
 */
export type IconName = 'swords' | 'map' | 'spellbook';

export type IconProps = {
  name: IconName;
  /** Any CSS length. Defaults to 1.5rem, the size the nav rail wants. */
  size?: string;
};

const paths: Record<IconName, ReactNode> = {
  swords: (
    <>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" x2="9" y1="14" y2="18" />
      <line x1="7" x2="4" y1="17" y2="20" />
      <line x1="3" x2="5" y1="19" y2="21" />
    </>
  ),
  map: (
    <>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </>
  ),
  spellbook: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
};

/**
 * Decorative by default: every icon in this app sits inside a control that
 * already carries its own accessible name, so announcing the glyph again would
 * only duplicate it.
 */
export const Icon = ({ name, size = '1.5rem' }: IconProps) => (
  <Svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    $size={size}
  >
    {paths[name]}
  </Svg>
);

const Svg = styled.svg<{ $size: string }>`
  width: ${props => props.$size};
  height: ${props => props.$size};
  flex-shrink: 0;
`;
