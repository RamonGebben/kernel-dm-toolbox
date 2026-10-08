PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bastions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`owner_character_id` text,
	`name` text NOT NULL,
	`notes` text,
	`defender_count` integer DEFAULT 0 NOT NULL,
	`wall_squares` integer DEFAULT 0 NOT NULL,
	`is_fully_enclosed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bastions_defenders_not_negative" CHECK("__new_bastions"."defender_count" >= 0),
	CONSTRAINT "bastions_walls_not_negative" CHECK("__new_bastions"."wall_squares" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_bastions`("id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "owner_character_id", "name", "notes", "defender_count", "wall_squares", "is_fully_enclosed") SELECT "id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "owner_character_id", "name", "notes", "defender_count", "wall_squares", "is_fully_enclosed" FROM `bastions`;--> statement-breakpoint
DROP TABLE `bastions`;--> statement-breakpoint
ALTER TABLE `__new_bastions` RENAME TO `bastions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `bastions_one_live_per_owner` ON `bastions` (`owner_character_id`) WHERE "bastions"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE `bastion_basic_facilities` ADD `contributed_by_character_id` text REFERENCES player_characters(id);--> statement-breakpoint
ALTER TABLE `bastion_special_facilities` ADD `holder_character_id` text REFERENCES player_characters(id);--> statement-breakpoint
CREATE TABLE `__new_parties` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`treasury_gold` integer DEFAULT 0 NOT NULL,
	`bastion_mode` text DEFAULT 'per-character' NOT NULL,
	CONSTRAINT "parties_bastion_mode_is_valid" CHECK("__new_parties"."bastion_mode" in ('per-character', 'party'))
);
--> statement-breakpoint
INSERT INTO `__new_parties`("id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "treasury_gold", "bastion_mode") SELECT "id", "created_at", "updated_at", "deleted_at", "version", "updated_by", "treasury_gold", 'per-character' FROM `parties`;--> statement-breakpoint
DROP TABLE `parties`;--> statement-breakpoint
ALTER TABLE `__new_parties` RENAME TO `parties`;--> statement-breakpoint
-- Hand-added backfill: every existing bastion is a per-character one, so its
-- owner holds each special facility and brought each room.
UPDATE `bastion_special_facilities` SET `holder_character_id` = (SELECT `owner_character_id` FROM `bastions` WHERE `bastions`.`id` = `bastion_special_facilities`.`bastion_id`);--> statement-breakpoint
UPDATE `bastion_basic_facilities` SET `contributed_by_character_id` = (SELECT `owner_character_id` FROM `bastions` WHERE `bastions`.`id` = `bastion_basic_facilities`.`bastion_id`);
