-- AlterTable
ALTER TABLE "Client" ADD COLUMN "codeParrainage" TEXT,
ADD COLUMN "parrainId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_codeParrainage_key" ON "Client"("codeParrainage");
