-- CreateEnum
CREATE TYPE "ReactionKind" AS ENUM ('LIKE', 'SUPPORT', 'CONCERN', 'INSIGHT');

-- Postal metadata for private nation delivery.
ALTER TABLE "NationMessage" ADD COLUMN "serviceName" TEXT NOT NULL DEFAULT 'Nation Wheel Postal Service';
ALTER TABLE "NationMessage" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DELIVERED';
ALTER TABLE "NationMessage" ADD COLUMN "trackingCode" TEXT;

UPDATE "NationMessage"
SET "trackingCode" = 'NWPS-' || upper(substr("id", 1, 10))
WHERE "trackingCode" IS NULL;

ALTER TABLE "NationMessage" ALTER COLUMN "trackingCode" SET NOT NULL;
CREATE UNIQUE INDEX "NationMessage_trackingCode_key" ON "NationMessage"("trackingCode");

-- CreateTable
CREATE TABLE "WorldNewsReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldNewsReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumReaction" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldNewsReaction_postId_userId_kind_key" ON "WorldNewsReaction"("postId", "userId", "kind");
CREATE INDEX "WorldNewsReaction_postId_kind_idx" ON "WorldNewsReaction"("postId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ForumThread_slug_key" ON "ForumThread"("slug");
CREATE INDEX "ForumThread_category_updatedAt_idx" ON "ForumThread"("category", "updatedAt");
CREATE INDEX "ForumThread_authorId_createdAt_idx" ON "ForumThread"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_threadId_createdAt_idx" ON "ForumPost"("threadId", "createdAt");
CREATE INDEX "ForumPost_authorId_createdAt_idx" ON "ForumPost"("authorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForumReaction_threadId_userId_kind_key" ON "ForumReaction"("threadId", "userId", "kind");
CREATE INDEX "ForumReaction_threadId_kind_idx" ON "ForumReaction"("threadId", "kind");

-- AddForeignKey
ALTER TABLE "WorldNewsReaction" ADD CONSTRAINT "WorldNewsReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "WorldNewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorldNewsReaction" ADD CONSTRAINT "WorldNewsReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumReaction" ADD CONSTRAINT "ForumReaction_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumReaction" ADD CONSTRAINT "ForumReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
