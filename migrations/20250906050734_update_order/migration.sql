/*
  Warnings:

  - You are about to alter the column `order_number` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `updated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `expected_delivery_date` DATETIME(3) NULL,
    ADD COLUMN `paid_at` DATETIME(3) NULL,
    ADD COLUMN `payment_method` ENUM('cash_on_delivery', 'bank_transfer', 'credit_card', 'e_wallet', 'installment') NOT NULL DEFAULT 'cash_on_delivery',
    ADD COLUMN `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    ADD COLUMN `shipping_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `shipping_method` ENUM('standard_delivery', 'express_delivery', 'same_day_delivery', 'pickup_at_store', 'installation_service') NOT NULL DEFAULT 'standard_delivery',
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    MODIFY `order_number` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `updated_at` DATETIME(3) NULL;
