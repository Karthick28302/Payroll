-- ============================================================
-- Smart Attendance System — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- ------------------------------------------------------------
-- admins: users who can log into the admin dashboard
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,          -- store bcrypt hash, never plain text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- users: registered employees whose faces are recognised
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,  -- lowercase, trimmed (matches face encoding key)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- attendance: one row per login session per day per user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    login_time  DATETIME NOT NULL,
    logout_time DATETIME DEFAULT NULL,        -- NULL means still present
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, login_time)
);