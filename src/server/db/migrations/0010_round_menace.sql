CREATE TABLE `map_measurement_shapes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`map_id` text NOT NULL,
	`shape_type` text NOT NULL,
	`origin_x` real NOT NULL,
	`origin_y` real NOT NULL,
	`extent_feet` real NOT NULL,
	`orientation` real,
	`label` text,
	`color` text DEFAULT '#6fa7ff' NOT NULL,
	`source_spell_slug` text,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_spell_slug`) REFERENCES `spells`(`slug`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "map_measurement_shapes_type_is_valid" CHECK("map_measurement_shapes"."shape_type" in ('ruler', 'circle', 'cone', 'line', 'cube'))
);
--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `live_preview_shape` text;