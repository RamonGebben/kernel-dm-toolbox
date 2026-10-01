CREATE TABLE `bastion_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`number` integer NOT NULL,
	`status` text NOT NULL,
	`draft` text NOT NULL,
	`summary` text,
	`committed_at` integer,
	CONSTRAINT "bastion_turns_status_is_valid" CHECK("bastion_turns"."status" in ('draft', 'committed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bastion_turns_one_draft` ON `bastion_turns` (`status`) WHERE "bastion_turns"."status" = 'draft' and "bastion_turns"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE `bastion_special_facilities` ADD `job_option_key` text;--> statement-breakpoint
ALTER TABLE `bastion_special_facilities` ADD `job_note` text;--> statement-breakpoint
ALTER TABLE `bastion_special_facilities` ADD `job_days_remaining` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bastion_special_facilities` ADD `out_of_action_turns` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bastions` ADD `is_armory_stocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bastions` ADD `has_guest_monster` integer DEFAULT false NOT NULL;