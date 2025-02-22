CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'default_avatar_1.png',
    avatar_uri VARCHAR(255) DEFAULT NULL COMMENT 'Local avatar image path',
    avatar_seed VARCHAR(255) DEFAULT NULL COMMENT 'Seed for DiceBear avatar generation',
    status TINYINT(1) DEFAULT 1 COMMENT '1: active, 0: inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;