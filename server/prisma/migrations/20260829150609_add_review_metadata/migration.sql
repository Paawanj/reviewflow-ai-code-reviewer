/*
  Warnings:

  - Added the required column `model` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "contextUsed" JSONB,
ADD COLUMN     "model" TEXT NOT NULL;
