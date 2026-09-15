ALTER TABLE `creature_actions` ADD `applies_condition_slug` text REFERENCES conditions(slug);--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `condition_duration_rounds` integer;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `condition_save_ends_each_turn` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `creature_actions` ADD `multiattack_sequence` text;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `applies_condition_slug` text REFERENCES conditions(slug);--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `condition_duration_rounds` integer;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `condition_save_ends_each_turn` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_creature_actions` ADD `multiattack_sequence` text;--> statement-breakpoint
ALTER TABLE `player_character_actions` ADD `applies_condition_slug` text REFERENCES conditions(slug);--> statement-breakpoint
ALTER TABLE `player_character_actions` ADD `condition_duration_rounds` integer;--> statement-breakpoint
ALTER TABLE `player_character_actions` ADD `condition_save_ends_each_turn` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `spells` ADD `applies_condition_slug` text REFERENCES conditions(slug);--> statement-breakpoint
ALTER TABLE `spells` ADD `condition_duration_rounds` integer;--> statement-breakpoint
ALTER TABLE `spells` ADD `condition_save_ends_each_turn` integer DEFAULT false NOT NULL;