-- AlterTable
ALTER TABLE "Avis" ADD COLUMN     "reponse" TEXT,
ADD COLUMN     "reponseAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Commercant" ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3);
