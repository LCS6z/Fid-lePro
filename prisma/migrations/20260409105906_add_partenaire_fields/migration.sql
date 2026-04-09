-- AlterTable
ALTER TABLE "Commercant" ADD COLUMN     "categorie" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "estPartenaire" BOOLEAN NOT NULL DEFAULT false;
