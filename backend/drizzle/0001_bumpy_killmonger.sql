CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`created_at` integer DEFAULT '"2025-12-26T11:19:25.472Z"'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`equipment` text NOT NULL,
	`type` text NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT '"2025-12-26T11:19:25.475Z"'
);
--> statement-breakpoint
INSERT INTO `__new_exercises`("id", "name", "muscle_group", "equipment", "type", "image_url", "created_at") SELECT "id", "name", "muscle_group", "equipment", "type", "image_url", "created_at" FROM `exercises`;--> statement-breakpoint
DROP TABLE `exercises`;--> statement-breakpoint
ALTER TABLE `__new_exercises` RENAME TO `exercises`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_routines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sections` text NOT NULL,
	`created_at` integer DEFAULT '"2025-12-26T11:19:25.477Z"'
);
--> statement-breakpoint
INSERT INTO `__new_routines`("id", "name", "sections", "created_at") SELECT "id", "name", "sections", "created_at" FROM `routines`;--> statement-breakpoint
DROP TABLE `routines`;--> statement-breakpoint
ALTER TABLE `__new_routines` RENAME TO `routines`;--> statement-breakpoint
CREATE TABLE `__new_workout_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`routine_id` integer,
	`data` text NOT NULL,
	`created_at` integer DEFAULT '"2025-12-26T11:19:25.477Z"'
);
--> statement-breakpoint
INSERT INTO `__new_workout_logs`("id", "date", "routine_id", "data", "created_at") SELECT "id", "date", "routine_id", "data", "created_at" FROM `workout_logs`;--> statement-breakpoint
DROP TABLE `workout_logs`;--> statement-breakpoint
ALTER TABLE `__new_workout_logs` RENAME TO `workout_logs`;