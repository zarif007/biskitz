/*
  Warnings:

  - You are about to drop the column `totalTokens` on the `Message` table. All the data in the column will be lost.
  - Added the required column `inputTokens` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputTokens` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "totalTokens",
ADD COLUMN     "inputTokens" INTEGER NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "outputTokens" INTEGER NOT NULL;
