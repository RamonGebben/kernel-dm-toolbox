CREATE TABLE `player_character_action_attacks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`player_character_action_id` text NOT NULL,
	`name` text NOT NULL,
	`attack_type` text,
	`to_hit_mod` integer,
	`reach` integer,
	`range` integer,
	`long_range` integer,
	`target_creature_only` integer DEFAULT false NOT NULL,
	`damage_die_count` integer,
	`damage_die_type` text,
	`damage_bonus` integer,
	`damage_type` text,
	`extra_damage_die_count` integer,
	`extra_damage_die_type` text,
	`extra_damage_bonus` integer,
	`extra_damage_type` text,
	FOREIGN KEY (`player_character_action_id`) REFERENCES `player_character_actions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `player_character_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`player_character_id` text NOT NULL,
	`name` text NOT NULL,
	`desc` text NOT NULL,
	`action_type` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legendary_action_cost` integer,
	`uses_type` text,
	`uses_param` integer,
	`save_ability` text,
	`save_dc` integer,
	`area_type` text,
	`area_size` real,
	`area_size_unit` text,
	`damage_on_fail_roll` text,
	`damage_on_fail_type` text,
	`half_damage_on_save` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`player_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `player_character_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`player_character_id` text NOT NULL,
	`resource_key` text NOT NULL,
	`name` text NOT NULL,
	`max_uses` integer,
	`is_unlimited` integer DEFAULT false NOT NULL,
	`resets_on` text NOT NULL,
	FOREIGN KEY (`player_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `player_character_spell_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`player_character_id` text NOT NULL,
	`spell_level` integer NOT NULL,
	`max_slots` integer NOT NULL,
	FOREIGN KEY (`player_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `player_character_spells` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`player_character_id` text NOT NULL,
	`spell_slug` text NOT NULL,
	`is_prepared` integer DEFAULT true NOT NULL,
	`is_always_available` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`player_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_slug`) REFERENCES `spells`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `player_characters` ADD `character_class_slug` text REFERENCES character_classes(slug);--> statement-breakpoint
ALTER TABLE `player_characters` ADD `subclass_slug` text REFERENCES character_classes(slug);