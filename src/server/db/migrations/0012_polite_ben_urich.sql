CREATE TABLE `spell_effects` (
	`spell_slug` text PRIMARY KEY NOT NULL,
	`source_path` text NOT NULL,
	`storage_path` text NOT NULL,
	`mime_type` text DEFAULT 'video/webm' NOT NULL,
	`byte_size` integer NOT NULL,
	FOREIGN KEY (`spell_slug`) REFERENCES `spells`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `import_runs` ADD `effect_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `map_measurement_shapes` ADD `effect_playback_started_at` integer;