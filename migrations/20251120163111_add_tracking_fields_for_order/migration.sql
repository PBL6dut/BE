/*
  Warnings:

  - You are about to drop the column `public_id` on the `Product_Image` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transaction_id]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Product_Image` DROP FOREIGN KEY `Product_Image_product_id_fkey`;

-- DropIndex
DROP INDEX `Product_Image_product_id_fkey` ON `Product_Image`;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `gateway` VARCHAR(50) NULL,
    ADD COLUMN `paid_amount` DECIMAL(12, 2) NULL,
    ADD COLUMN `payment_verified_at` DATETIME(3) NULL,
    ADD COLUMN `transaction_code` VARCHAR(50) NULL,
    ADD COLUMN `transaction_content` TEXT NULL,
    ADD COLUMN `transaction_id` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `Product_Image` DROP COLUMN `public_id`;

-- CreateIndex
CREATE UNIQUE INDEX `Order_transaction_id_key` ON `Order`(`transaction_id`);

-- CreateIndex
CREATE INDEX `Order_transaction_id_idx` ON `Order`(`transaction_id`);

-- CreateIndex
CREATE INDEX `Order_payment_status_idx` ON `Order`(`payment_status`);

-- CreateIndex
CREATE INDEX `Order_order_number_idx` ON `Order`(`order_number`);

-- AddForeignKey
ALTER TABLE `Product_Image` ADD CONSTRAINT `Product_Image_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
