-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubLogin" TEXT,
ADD COLUMN     "githubTokenEncrypted" TEXT,
ADD COLUMN     "githubTokenScopes" TEXT;
