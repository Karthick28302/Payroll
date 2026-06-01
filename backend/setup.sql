-- Complete database setup
CREATE DATABASE IF NOT EXISTS attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendance_system;

DROP TABLE IF EXISTS camera_health_logs;
DROP TABLE IF EXISTS camera_recordings;
DROP TABLE IF EXISTS camera_sources;
DROP TABLE IF EXISTS payroll_payouts;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    monthly_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pf_percent DECIMAL(5, 2) NOT NULL DEFAULT 12,
    savings_percent DECIMAL(5, 2) NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP NOT NULL,
    logout_time TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_login_time (login_time),
    INDEX idx_user_date (user_id, login_time)
);

CREATE TABLE payroll_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    payroll_year INT NOT NULL,
    payroll_month INT NOT NULL,
    payout_status ENUM('pending', 'in_progress', 'processed') NOT NULL DEFAULT 'pending',
    paid_at DATETIME NULL,
    payment_ref VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_month (user_id, payroll_year, payroll_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE camera_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    source_type ENUM('usb', 'rtsp', 'http') NOT NULL DEFAULT 'usb',
    source_value VARCHAR(500) NOT NULL,
    username VARCHAR(100) NULL,
    password_ref VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE camera_recordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_source_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME NULL,
    duration_seconds INT NULL,
    file_size_bytes BIGINT NULL,
    recording_status ENUM('recording', 'completed', 'failed') NOT NULL DEFAULT 'recording',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_source_id) REFERENCES camera_sources(id) ON DELETE CASCADE
);

CREATE TABLE camera_health_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_source_id INT NULL,
    status ENUM('ok', 'warning', 'error') NOT NULL,
    message VARCHAR(500) NOT NULL,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_source_id) REFERENCES camera_sources(id) ON DELETE SET NULL
);

-- Default admin (admin/admin123)
INSERT INTO admins (username, password) VALUES 
('admin', SHA2('admin123', 256));

-- Sample data
INSERT INTO users (name) VALUES ('John Doe'), ('Jane Smith'), ('Demo User');
