CREATE TABLE IF NOT EXISTS `ai_search_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(36) NOT NULL,
  `user_id` INT NULL,
  `anonymous_id` VARCHAR(255) NULL,
  `query_type` ENUM('detect', 'recommend') NOT NULL,
  `platform` VARCHAR(50) NULL,
  `source_feature` VARCHAR(100) NULL,
  `original_image_url` TEXT NULL,
  `detected_objects` JSON NULL,
  `selected_bbox` JSON NULL,
  `recommendations` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `ai_search_history_session_id_key` (`session_id`),
  INDEX `ai_search_history_user_id_idx` (`user_id`),
  INDEX `ai_search_history_anonymous_id_idx` (`anonymous_id`),
  INDEX `ai_search_history_created_at_idx` (`created_at`),
  INDEX `ai_search_history_session_id_idx` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
