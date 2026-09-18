PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_maps` (
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
	`fog` text DEFAULT '{"enabled":false,"baseState":"covered","opacityDm":0.6,"opacityTable":0.9,"baselineImage":null,"strokes":[]}' NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `map_folders`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "maps_kind_is_valid" CHECK("__new_maps"."kind" in ('image', 'video'))
);
--> statement-breakpoint
INSERT INTO `__new_maps`("id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "folder_id", "name", "kind", "storage_path", "original_filename", "mime_type", "byte_size", "native_width", "native_height", "grid_cell_size", "grid_origin_x", "grid_origin_y", "fog") SELECT "id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "folder_id", "name", "kind", "storage_path", "original_filename", "mime_type", "byte_size", "native_width", "native_height", "grid_cell_size", "grid_origin_x", "grid_origin_y", "fog" FROM `maps`;--> statement-breakpoint
DROP TABLE `maps`;--> statement-breakpoint
ALTER TABLE `__new_maps` RENAME TO `maps`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `maps_storage_path_unique` ON `maps` (`storage_path`);