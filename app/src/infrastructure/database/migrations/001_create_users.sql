-- User Management Service — initial schema migration
-- Run once against the target MySQL / AWS RDS database.

CREATE DATABASE IF NOT EXISTS user_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE user_management;

CREATE TABLE IF NOT EXISTS users (
  id                 CHAR(36)      NOT NULL,
  email              VARCHAR(255)  NOT NULL,
  password_hash      VARCHAR(255)  NOT NULL,
  first_name         VARCHAR(100)  NOT NULL,
  last_name          VARCHAR(100)  NOT NULL,
  is_verified        TINYINT(1)    NOT NULL DEFAULT 0,
  verification_token CHAR(36)          NULL,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_verification_token (verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
