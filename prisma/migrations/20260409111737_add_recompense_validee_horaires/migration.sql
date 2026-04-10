-- AlterTable
ALTER TABLE "Commercant" ADD COLUMN     "horaires" TEXT;

-- CreateTable
CREATE TABLE "RecompenseValidee" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "carteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecompenseValidee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecompenseValidee" ADD CONSTRAINT "RecompenseValidee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompenseValidee" ADD CONSTRAINT "RecompenseValidee_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "Carte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
