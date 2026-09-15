CREATE TABLE `simulator_scenario_monster_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`scenario_id` text NOT NULL,
	`creature_slug` text,
	`custom_creature_id` text,
	`count` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`position_x` integer,
	`position_y` integer,
	FOREIGN KEY (`scenario_id`) REFERENCES `simulator_scenarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creature_slug`) REFERENCES `creatures`(`slug`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`custom_creature_id`) REFERENCES `custom_creatures`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "simulator_scenario_monster_entry_has_exactly_one_source" CHECK(("simulator_scenario_monster_entries"."creature_slug" is not null) <> ("simulator_scenario_monster_entries"."custom_creature_id" is not null))
);
--> statement-breakpoint
CREATE TABLE `simulator_scenario_party_members` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`scenario_id` text NOT NULL,
	`player_character_id` text NOT NULL,
	`position_x` integer,
	`position_y` integer,
	FOREIGN KEY (`scenario_id`) REFERENCES `simulator_scenarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simulator_scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`trial_count` integer DEFAULT 100 NOT NULL,
	`last_run_at` integer,
	`last_run_summary` text
);
