-- AlterTable
ALTER TABLE "Tile" ADD COLUMN     "crop" TEXT,
ADD COLUMN     "plantedAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3);
