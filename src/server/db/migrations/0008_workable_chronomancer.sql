PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_map_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`active_map_id` text,
	`dm_viewport_x` real DEFAULT 0 NOT NULL,
	`dm_viewport_y` real DEFAULT 0 NOT NULL,
	`dm_viewport_zoom` real DEFAULT 1 NOT NULL,
	`player_viewport_x` real DEFAULT 0 NOT NULL,
	`player_viewport_y` real DEFAULT 0 NOT NULL,
	`player_viewport_zoom` real DEFAULT 1 NOT NULL,
	`player_viewport_rotation` real,
	`player_screen_width` integer DEFAULT 1920 NOT NULL,
	`player_screen_height` integer DEFAULT 1080 NOT NULL,
	`is_viewport_locked` integer DEFAULT false NOT NULL,
	`grid_visible` integer DEFAULT true NOT NULL,
	`grid_color` text DEFAULT '#e0e5f5' NOT NULL,
	`grid_opacity` real DEFAULT 0.18 NOT NULL,
	`grid_background_color` text DEFAULT '#0c0d11' NOT NULL,
	`player_screen_mode` text DEFAULT 'tracker' NOT NULL,
	`player_screen_orientation` text DEFAULT 'auto' NOT NULL,
	FOREIGN KEY (`active_map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "map_sessions_mode_is_valid" CHECK("__new_map_sessions"."player_screen_mode" in ('map', 'tracker', 'both')),
	CONSTRAINT "map_sessions_orientation_is_valid" CHECK("__new_map_sessions"."player_screen_orientation" in ('auto', 'landscape', 'portrait'))
);
--> statement-breakpoint
INSERT INTO `__new_map_sessions`("id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "active_map_id", "dm_viewport_x", "dm_viewport_y", "dm_viewport_zoom", "player_viewport_x", "player_viewport_y", "player_viewport_zoom", "player_viewport_rotation", "player_screen_width", "player_screen_height", "is_viewport_locked", "grid_visible", "grid_color", "grid_opacity", "grid_background_color", "player_screen_mode", "player_screen_orientation") SELECT "id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "active_map_id", "dm_viewport_x", "dm_viewport_y", "dm_viewport_zoom", "player_viewport_x", "player_viewport_y", "player_viewport_zoom", "player_viewport_rotation", "player_screen_width", "player_screen_height", "is_viewport_locked", "grid_visible", "grid_color", "grid_opacity", "grid_background_color", "player_screen_mode", 'auto' FROM `map_sessions`;--> statement-breakpoint
DROP TABLE `map_sessions`;--> statement-breakpoint
ALTER TABLE `__new_map_sessions` RENAME TO `map_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;