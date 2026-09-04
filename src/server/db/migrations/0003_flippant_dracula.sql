CREATE TABLE `combatants` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`encounter_id` text NOT NULL,
	`creature_slug` text,
	`player_character_id` text,
	`display_name` text NOT NULL,
	`initiative` integer DEFAULT 0 NOT NULL,
	`current_hit_points` integer NOT NULL,
	`max_hit_points` integer NOT NULL,
	`temporary_hit_points` integer DEFAULT 0 NOT NULL,
	`armor_class` integer NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`is_delayed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creature_slug`) REFERENCES `creatures`(`slug`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "combatant_has_exactly_one_source" CHECK(("combatants"."creature_slug" is not null) <> ("combatants"."player_character_id" is not null))
);
--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`round_number` integer DEFAULT 0 NOT NULL,
	`active_combatant_id` text
);
