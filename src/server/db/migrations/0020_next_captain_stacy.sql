CREATE TABLE `bastion_basic_facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`bastion_id` text NOT NULL,
	`type` text NOT NULL,
	`space` text NOT NULL,
	FOREIGN KEY (`bastion_id`) REFERENCES `bastions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bastion_basic_facilities_type_is_valid" CHECK("bastion_basic_facilities"."type" in ('bedroom', 'dining-room', 'parlor', 'courtyard', 'kitchen', 'storage')),
	CONSTRAINT "bastion_basic_facilities_space_is_valid" CHECK("bastion_basic_facilities"."space" in ('cramped', 'roomy', 'vast'))
);
--> statement-breakpoint
CREATE INDEX `bastion_basic_facilities_bastion` ON `bastion_basic_facilities` (`bastion_id`);--> statement-breakpoint
CREATE TABLE `bastion_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`bastion_id` text NOT NULL,
	`kind` text NOT NULL,
	`basic_type` text,
	`space` text,
	`facility_id` text,
	`wall_squares` integer,
	`cost_gp` integer NOT NULL,
	`days_remaining` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`bastion_id`) REFERENCES `bastions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bastion_projects_kind_is_valid" CHECK("bastion_projects"."kind" in ('add-basic', 'enlarge-basic', 'enlarge-special', 'walls')),
	CONSTRAINT "bastion_projects_days_not_negative" CHECK("bastion_projects"."days_remaining" >= 0)
);
--> statement-breakpoint
CREATE INDEX `bastion_projects_bastion` ON `bastion_projects` (`bastion_id`);--> statement-breakpoint
CREATE TABLE `bastion_special_facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`bastion_id` text NOT NULL,
	`facility_key` text NOT NULL,
	`space` text NOT NULL,
	`variant` text,
	FOREIGN KEY (`bastion_id`) REFERENCES `bastions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bastion_special_facilities_space_is_valid" CHECK("bastion_special_facilities"."space" in ('cramped', 'roomy', 'vast'))
);
--> statement-breakpoint
CREATE INDEX `bastion_special_facilities_bastion` ON `bastion_special_facilities` (`bastion_id`);--> statement-breakpoint
CREATE TABLE `bastion_storage_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`bastion_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`note` text,
	`claimed_by_character_id` text,
	`claimed_at` integer,
	FOREIGN KEY (`bastion_id`) REFERENCES `bastions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`claimed_by_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bastion_storage_items_quantity_positive" CHECK("bastion_storage_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE INDEX `bastion_storage_items_bastion` ON `bastion_storage_items` (`bastion_id`);--> statement-breakpoint
CREATE TABLE `bastions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`owner_character_id` text NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`defender_count` integer DEFAULT 0 NOT NULL,
	`wall_squares` integer DEFAULT 0 NOT NULL,
	`is_fully_enclosed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner_character_id`) REFERENCES `player_characters`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bastions_defenders_not_negative" CHECK("bastions"."defender_count" >= 0),
	CONSTRAINT "bastions_walls_not_negative" CHECK("bastions"."wall_squares" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bastions_one_live_per_owner` ON `bastions` (`owner_character_id`) WHERE "bastions"."deleted_at" is null;