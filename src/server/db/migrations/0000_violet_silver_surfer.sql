CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);