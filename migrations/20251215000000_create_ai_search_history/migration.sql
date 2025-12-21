-- Migration: Create ai_search_history table
-- Purpose: Store AI search history for detect and recommendation queries
-- Date: 2025-01-15
CREATE TABLE IF NOT EXISTS ai_search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NULL,
    anonymous_id VARCHAR(255) NULL,
    query_type ENUM('detect', 'recommend') NOT NULL,
    platform VARCHAR(50) NULL COMMENT 'web|app|mobile',
    source_feature VARCHAR(100) NULL COMMENT 'main_search|detail_page',
    original_image_url TEXT NULL,
    detected_objects JSON NULL COMMENT 'Array of detected objects with bbox, confidence, class_name',
    selected_bbox JSON NULL COMMENT 'Selected bounding box for recommendations',
    recommendations JSON NULL COMMENT 'Array of recommended products',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_anonymous_id (anonymous_id),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;