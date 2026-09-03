-- CreateEnum
CREATE TYPE "RepositorySourceType" AS ENUM ('CONNECTED_GITHUB', 'PUBLIC_URL');

-- CreateEnum
CREATE TYPE "RepositoryIndexStatus" AS ENUM ('NOT_INDEXED', 'QUEUED', 'INDEXING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "indexError" TEXT,
ADD COLUMN     "indexStatus" "RepositoryIndexStatus" NOT NULL DEFAULT 'NOT_INDEXED',
ADD COLUMN     "lastIndexedAt" TIMESTAMP(3),
ADD COLUMN     "lastIndexedSha" TEXT,
ADD COLUMN     "sourceType" "RepositorySourceType" NOT NULL DEFAULT 'CONNECTED_GITHUB';
