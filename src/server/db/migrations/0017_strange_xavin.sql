CREATE TABLE `character_class_features` (
	`slug` text PRIMARY KEY NOT NULL,
	`class_slug` text NOT NULL,
	`name` text NOT NULL,
	`desc` text NOT NULL,
	FOREIGN KEY (`class_slug`) REFERENCES `character_classes`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_classes` (
	`slug` text PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`name` text NOT NULL,
	`desc` text,
	`hit_dice` text,
	`caster_type` text NOT NULL,
	`primary_abilities` text DEFAULT '[]' NOT NULL,
	`saving_throws` text DEFAULT '[]' NOT NULL,
	`subclass_of_slug` text
);
--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `save_ability` text;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `save_dc` integer;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `area_type` text;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `area_size` real;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `area_size_unit` text;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `damage_on_fail_roll` text;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `damage_on_fail_type` text;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `half_damage_on_save` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `save_ability` text;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `save_dc` integer;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `area_type` text;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `area_size` real;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `area_size_unit` text;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `damage_on_fail_roll` text;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `damage_on_fail_type` text;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `half_damage_on_save` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `import_runs` ADD `character_class_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `import_runs` ADD `class_feature_count` integer DEFAULT 0 NOT NULL;