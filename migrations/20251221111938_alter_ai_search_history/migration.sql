/*
  Warnings:

  - Made the column `created_at` on table `ai_search_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `ai_search_history` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ai_search_history` ADD COLUMN `avg_match_score` DOUBLE NULL DEFAULT 0.0,
    ADD COLUMN `dominant_colors` JSON NULL,
    ADD COLUMN `query_category` VARCHAR(50) NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `ai_search_history_query_category_idx` ON `ai_search_history`(`query_category`);

-- RenameIndex
ALTER TABLE `ai_search_history` RENAME INDEX `idx_anonymous_id` TO `ai_search_history_anonymous_id_idx`;

-- RenameIndex
ALTER TABLE `ai_search_history` RENAME INDEX `idx_created_at` TO `ai_search_history_created_at_idx`;

-- RenameIndex
ALTER TABLE `ai_search_history` RENAME INDEX `idx_session_id` TO `ai_search_history_session_id_idx`;

-- RenameIndex
ALTER TABLE `ai_search_history` RENAME INDEX `idx_user_id` TO `ai_search_history_user_id_idx`;

-- RenameIndex
ALTER TABLE `ai_search_history` RENAME INDEX `session_id` TO `ai_search_history_session_id_key`;
