CREATE TABLE `spell_casting_options` (
	`id` text PRIMARY KEY NOT NULL,
	`spell_slug` text NOT NULL,
	`type` text NOT NULL,
	`desc` text,
	`damage_roll` text,
	`duration` text,
	`range` text,
	`target_count` integer,
	`shape_size` real,
	`concentration` integer,
	FOREIGN KEY (`spell_slug`) REFERENCES `spells`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spells` (
	`slug` text PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`name` text NOT NULL,
	`desc` text NOT NULL,
	`level` integer NOT NULL,
	`school` text NOT NULL,
	`higher_level` text,
	`target_type` text,
	`range_text` text,
	`range` real DEFAULT 0 NOT NULL,
	`range_unit` text,
	`target_count` integer DEFAULT 0 NOT NULL,
	`casting_time` text NOT NULL,
	`reaction_condition` text,
	`ritual` integer DEFAULT false NOT NULL,
	`concentration` integer DEFAULT false NOT NULL,
	`duration` text NOT NULL,
	`verbal` integer DEFAULT false NOT NULL,
	`somatic` integer DEFAULT false NOT NULL,
	`material` integer DEFAULT false NOT NULL,
	`material_specified` text,
	`material_consumed` integer DEFAULT false NOT NULL,
	`saving_throw_ability` text,
	`attack_roll` integer DEFAULT false NOT NULL,
	`damage_roll` text,
	`damage_types` text DEFAULT '[]' NOT NULL,
	`shape_type` text,
	`shape_size` real,
	`shape_size_unit` text,
	`classes` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `import_runs` ADD `spell_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `import_runs` ADD `casting_option_count` integer DEFAULT 0 NOT NULL;