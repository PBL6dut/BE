-- Add analytics fields to ai_search_history table
-- Migration: add_analytics_fields_to_ai_search_history
-- Created: 2025-12-21

-- Add new columns
ALTER TABLE `ai_search_history`
ADD COLUMN `query_category` VARCHAR(50) NULL COMMENT 'Room category: Living Room, Bedroom, Kitchen, Office, Other',
ADD COLUMN `avg_match_score` FLOAT NULL DEFAULT 0.0 COMMENT 'Average similarity score from recommendations (0.0-1.0)',
ADD COLUMN `dominant_colors` JSON NULL COMMENT 'Top 2 dominant colors array';

-- Create index for query_category for analytics queries
CREATE INDEX `ai_search_history_query_category_idx` ON `ai_search_history`(`query_category`);

-- Verify changes
SELECT COUNT(*) as total_records FROM ai_search_history;
DESCRIBE ai_search_history;
