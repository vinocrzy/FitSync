CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`equipment` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT '"2025-12-26T10:29:55.137Z"'
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sections` text NOT NULL,
	`created_at` integer DEFAULT '"2025-12-26T10:29:55.139Z"'
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`routine_id` integer,
	`data` text NOT NULL,
	`created_at` integer DEFAULT '"2025-12-26T10:29:55.139Z"'
);
