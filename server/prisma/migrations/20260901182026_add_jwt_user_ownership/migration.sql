/*
  Warnings:

  - A unique constraint covering the columns `[userId,fullName]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Repository_fullName_key";

-- DropIndex
DROP INDEX "Repository_githubId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_fullName_key" ON "Repository"("userId", "fullName");
