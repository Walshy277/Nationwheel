-- CreateEnum
CREATE TYPE "AlertCategory" AS ENUM (
    'MAIL',
    'ACTION_STATUS',
    'ACTION_UPDATE',
    'WIKI_EDIT',
    'PROFILE_UPDATE',
    'SPIN_RESULT'
);

ALTER TABLE "User" ADD COLUMN "alertOptOuts" "AlertCategory"[] DEFAULT ARRAY[]::"AlertCategory"[];
ALTER TABLE "LeaderNotification" ADD COLUMN "category" "AlertCategory" NOT NULL DEFAULT 'ACTION_UPDATE';

UPDATE "LeaderNotification"
SET "category" = CASE
  WHEN "messageId" IS NOT NULL THEN 'MAIL'::"AlertCategory"
  WHEN "title" ILIKE '%wiki%' THEN 'WIKI_EDIT'::"AlertCategory"
  WHEN "title" ILIKE '%profile%' OR "title" ILIKE '%overview%' OR "title" ILIKE '%stats%' THEN 'PROFILE_UPDATE'::"AlertCategory"
  WHEN "title" ILIKE '%status%' OR "title" ILIKE '%completed%' THEN 'ACTION_STATUS'::"AlertCategory"
  ELSE 'ACTION_UPDATE'::"AlertCategory"
END;
