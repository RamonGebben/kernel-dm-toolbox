'use client';

import styled from 'styled-components';

interface TrackerOverlayProps {
  $left?: number;
  $right?: number;
  $top?: number;
  $bottom?: number;
  $width: number;
  $height: number;
  $opacity: number;
}

const toPercent = (fraction: number | undefined): string | undefined =>
  fraction === undefined ? undefined : `${fraction * 100}%`;

/**
 * `min-height`, not `height` — projected onto a TV with no controls, so a
 * scrollbar (from a fixed height too short for the current roster) is not
 * an option. The DM's size setting is a floor the box grows past as needed
 * to keep every combatant visible, never a ceiling that clips or scrolls.
 *
 * The rect is an inline style rather than part of the class: it follows the
 * DM's drag frame by frame, and a class per position would never be evicted.
 */
export const TrackerOverlay = styled.div.attrs<TrackerOverlayProps>(props => ({
  style: {
    left: toPercent(props.$left),
    right: toPercent(props.$right),
    top: toPercent(props.$top),
    bottom: toPercent(props.$bottom),
    width: toPercent(props.$width),
    minHeight: toPercent(props.$height),
    opacity: props.$opacity,
  },
}))`
  position: absolute;
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color('background')} 88%, transparent)`};
  backdrop-filter: blur(8px);
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('base')};
  box-shadow: ${props => props.theme.boxShadow('card')};
`;
