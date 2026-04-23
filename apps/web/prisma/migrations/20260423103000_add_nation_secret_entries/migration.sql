CREATE TABLE "NationSecretEntry" (
    "id" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "actionId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "screenshotImage" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationSecretEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NationSecretEntry_nationId_createdAt_idx" ON "NationSecretEntry"("nationId", "createdAt");
CREATE INDEX "NationSecretEntry_actionId_idx" ON "NationSecretEntry"("actionId");

ALTER TABLE "NationSecretEntry" ADD CONSTRAINT "NationSecretEntry_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NationSecretEntry" ADD CONSTRAINT "NationSecretEntry_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "LoreAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NationSecretEntry" ADD CONSTRAINT "NationSecretEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
