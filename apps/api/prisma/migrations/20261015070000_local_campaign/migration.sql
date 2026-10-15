ALTER TABLE "characters" ADD COLUMN "campaignChapter" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "characters" ADD COLUMN "campaignCycles" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "stage_attempts" ADD COLUMN "requestKey" TEXT;
CREATE UNIQUE INDEX "stage_attempts_requestKey_key" ON "stage_attempts"("requestKey");
ALTER TYPE "EconomyLogType" ADD VALUE 'NPC_PURCHASE';
ALTER TYPE "EconomyLogType" ADD VALUE 'NPC_SALE';
ALTER TYPE "EconomyLogType" ADD VALUE 'EQUIPMENT_CHANGE';
ALTER TYPE "EconomyLogType" ADD VALUE 'ITEM_DROP';
