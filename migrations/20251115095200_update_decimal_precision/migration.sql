/*
  Warnings:

  - You are about to alter the column `unit_price` on the `OrderDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to alter the column `total_price` on the `OrderDetail` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to alter the column `sale_price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE `OrderDetail` MODIFY `unit_price` DECIMAL(12, 2) NOT NULL,
    MODIFY `total_price` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Product` MODIFY `price` DECIMAL(12, 2) NOT NULL,
    MODIFY `sale_price` DECIMAL(12, 2) NULL;
