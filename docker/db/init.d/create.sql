

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

CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- INSERT INTO `users` VALUES ;

CREATE TABLE `user_icon` (
  `id` int,
  `url` varchar(255)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `weekcount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
