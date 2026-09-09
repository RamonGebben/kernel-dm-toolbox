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

/** Each entry only asks for the one colour token it needs, rather than the
 * whole theme, so this stays trivially testable without a theme fixture. */
export const healthStatusColor = {
  healthy: (color: { success: string }) => color.success,
  bloodied: (color: { warning: string }) => color.warning,
  unconscious: (color: { danger: string }) => color.danger,
} as const;
