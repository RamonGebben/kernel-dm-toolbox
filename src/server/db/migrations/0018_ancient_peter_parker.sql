CREATE TABLE `parties` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`treasury_gold` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `player_characters` ADD `class_name` text;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `subclass` text;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `species` text;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `passive_perception` integer;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `passive_insight` integer;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `passive_investigation` integer;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `player_characters` ADD `gold` integer DEFAULT 0 NOT NULL;