CREATE TABLE `map_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `map_sessions` (
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
	FOREIGN KEY (`active_map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "map_sessions_mode_is_valid" CHECK("map_sessions"."player_screen_mode" in ('map', 'tracker', 'both'))
);
--> statement-breakpoint
CREATE TABLE `maps` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`folder_id` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`storage_path` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`native_width` integer,
	`native_height` integer,
	`grid_cell_size` real,
	`grid_origin_x` real DEFAULT 0 NOT NULL,
	`grid_origin_y` real DEFAULT 0 NOT NULL,
	`fog` text DEFAULT '{"enabled":false,"baseState":"covered","opacityDm":0.6,"opacityTable":0.9,"strokes":[]}' NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `map_folders`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "maps_kind_is_valid" CHECK("maps"."kind" in ('image', 'video'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `maps_storage_path_unique` ON `maps` (`storage_path`);