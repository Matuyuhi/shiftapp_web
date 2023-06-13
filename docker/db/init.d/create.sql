

-- user作成
CREATE USER 'shiftmaster'@'%' IDENTIFIED WITH mysql_native_password BY 'master';

create database shiftapp;

use shiftapp;


DROP TABLE IF EXISTS `adduser`;
CREATE TABLE `adduser` (
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE `misslist` (
  `post_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `missweek` date NOT NULL,
  `ena` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `posts` (
  `post_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `intime` varchar(255) NOT NULL,
  `outtime` varchar(255) NOT NULL,
  `comment` varchar(255) NOT NULL,
  `ena` tinyint(1) DEFAULT '1',
  `islate` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=502 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `sortuser`;
CREATE TABLE `sortuser` (
  `id` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `sortuser` WRITE;
/*!40000 ALTER TABLE `sortuser` DISABLE KEYS */;
INSERT INTO `sortuser` VALUES (1,'demo'),(2,'master');
/*!40000 ALTER TABLE `sortuser` ENABLE KEYS */;
UNLOCK TABLES;

CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (45,'demo','fe01ce2a7fbac8fafaed7c982a04e229',1),(46,'master','eb0a191797624dd3a48fa681d3061212',3);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;


CREATE TABLE `user_icon` (
  `id` int,
  `url` varchar(255)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `weekcount`;
CREATE TABLE `weekcount` (
  `user_id` int NOT NULL,
  `workcount` int DEFAULT '0',
  `latecount` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 付与
grant all on shiftapp.* to `shiftmaster`@`%`;

-- ログの有効化
set global general_log_file = "/var/log/mysql/general.log";
set global general_log = on;

set global wait_timeout=10;
