import type { BaseColor } from '@pindakaasman/design-system';
import type { HealthStatus } from '~/utils/applyDamage';

/**
 * The words and colour a player-facing health status renders as — shared by
 * `PlayerBoardView` (the full-screen tracker) and `TrackerOverlayBoardView`
 * (its compact twin layered over the map), so the two never drift out of
 * sync on what "Bloodied" means or looks like.
 */
export const healthStatusLabels = {
  healthy: 'Healthy',
  bloodied: 'Bloodied',
  unconscious: 'Down',
} as const satisfies Record<HealthStatus, string>;

/** The theme hue each status is drawn in, to pass to `theme.color()`. */
export const healthStatusColor = {
  healthy: 'tertiary',
  bloodied: 'quaternary',
  unconscious: 'error',
} as const satisfies Record<HealthStatus, BaseColor>;
