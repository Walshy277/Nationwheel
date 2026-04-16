ALTER TYPE "Role" ADD VALUE 'JOURNALIST';

CREATE TABLE "WorldNewsPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "sourceUrl" TEXT,
  "authorId" TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorldNewsPost_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorldNewsPost"
  ADD CONSTRAINT "WorldNewsPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "WorldNewsPost_publishedAt_idx" ON "WorldNewsPost"("publishedAt");
