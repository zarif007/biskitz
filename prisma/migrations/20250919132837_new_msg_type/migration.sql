/*
  Warnings:

  - Added the required column `type` to the `Fragment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."FragmentType" AS ENUM ('DOC', 'CODE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."MessageRole" ADD VALUE 'BUSINESS_ANALYST';
ALTER TYPE "public"."MessageRole" ADD VALUE 'SYSTEM_ARCHITECT';
ALTER TYPE "public"."MessageRole" ADD VALUE 'DEVELOPER';
ALTER TYPE "public"."MessageRole" ADD VALUE 'TESTER';
ALTER TYPE "public"."MessageRole" ADD VALUE 'SECURITY_ANALYST';
ALTER TYPE "public"."MessageRole" ADD VALUE 'DEV_OPS';

-- AlterTable
ALTER TABLE "public"."Fragment" ADD COLUMN     "type" "public"."FragmentType" NOT NULL;
