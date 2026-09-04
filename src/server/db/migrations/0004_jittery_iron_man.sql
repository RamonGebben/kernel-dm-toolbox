CREATE TABLE `combatant_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`combatant_id` text NOT NULL,
	`condition_slug` text NOT NULL,
	`rounds_remaining` integer,
	`note` text,
	FOREIGN KEY (`combatant_id`) REFERENCES `combatants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`condition_slug`) REFERENCES `conditions`(`slug`) ON UPDATE no action ON DELETE no action
);
