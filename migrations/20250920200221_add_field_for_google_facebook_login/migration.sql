/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebook_id]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebook_id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `facebook_id` VARCHAR(191) NULL,
    ADD COLUMN `google_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `facebook_id` VARCHAR(191) NULL,
    ADD COLUMN `google_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Admin_google_id_key` ON `Admin`(`google_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Admin_facebook_id_key` ON `Admin`(`facebook_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Customer_google_id_key` ON `Customer`(`google_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Customer_facebook_id_key` ON `Customer`(`facebook_id`);
