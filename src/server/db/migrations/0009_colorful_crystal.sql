ALTER TABLE `map_sessions` ADD `tracker_overlay_anchor_x` real DEFAULT 0.98 NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_anchor_y` real DEFAULT 0.98 NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_scale` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_opacity` real DEFAULT 0.9 NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_show_initiative` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_show_name` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_show_health` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `map_sessions` ADD `tracker_overlay_show_conditions` integer DEFAULT false NOT NULL;