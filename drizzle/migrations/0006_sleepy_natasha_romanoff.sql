CREATE TABLE `menu_clients` (
	`id` varchar(36) NOT NULL,
	`menu_id` varchar(36) NOT NULL,
	`cliente_id` int NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `menu_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `menu_id_idx` ON `menu_clients` (`menu_id`);--> statement-breakpoint
CREATE INDEX `cliente_id_idx` ON `menu_clients` (`cliente_id`);