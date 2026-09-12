'use client';

import type { MouseEvent } from 'react';
import styled from 'styled-components';

/** A named window, not `target="_blank"`'s always-a-fresh-tab behaviour —
 * `window.open` with the same name refocuses the window already open (one
 * the DM likely already dragged out to a second monitor/TV) instead of
 * spawning a new tab on every click. */
const PLAYER_SCREEN_WINDOW_NAME = 'kernel-dm-toolbox-player-screen';

/** `popup` drops the browser chrome (address bar, tabs); the size/position
 * are only a starting point for the *first* open — the DM drags and resizes
 * it onto the second monitor/TV from there, and every later click just
 * refocuses that same window rather than reapplying these. */
const WINDOW_FEATURES = 'popup';

export const openPlayerScreen = () => {
  window.open('/player', PLAYER_SCREEN_WINDOW_NAME, WINDOW_FEATURES);
};

/** Only a plain left-click is rerouted through the named `window.open` — a
 * modified click (ctrl/cmd/shift/alt) is left alone so the browser's own
 * "open in new tab" still works, and `href`/`target="_blank"` (never
 * prevented here) still cover middle-click and the right-click context
 * menu, which never fire this handler at all. */
const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  openPlayerScreen();
};

export type OpenPlayerScreenLinkProps = {
  className?: string;
};

/**
 * A link to the player screen that refocuses an already-open window instead
 * of spawning a new tab on every click. Presentational — its only "input" is
 * the click.
 */
export const OpenPlayerScreenLink = ({
  className,
}: OpenPlayerScreenLinkProps) => (
  <StyledAnchor
    href="/player"
    target="_blank"
    rel="noreferrer"
    className={className}
    onClick={handleClick}
  >
    Open the player screen ↗
  </StyledAnchor>
);

const StyledAnchor = styled.a`
  font-weight: 600;
  color: ${props => props.theme.color.accent};
`;
