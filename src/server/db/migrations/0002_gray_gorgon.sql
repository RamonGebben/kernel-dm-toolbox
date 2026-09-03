CREATE TABLE `player_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`name` text NOT NULL,
	`player_name` text,
	`armor_class` integer NOT NULL,
	`max_hit_points` integer NOT NULL,
	`initiative_modifier` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL
);
