-- AlterTable
ALTER TABLE "Client" ADD COLUMN "refreshToken" TEXT;

-- AlterTable
ALTER TABLE "Commercant" ADD COLUMN "refreshToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_refreshToken_key" ON "Client"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Commercant_refreshToken_key" ON "Commercant"("refreshToken");
