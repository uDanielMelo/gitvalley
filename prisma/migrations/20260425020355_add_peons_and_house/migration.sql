-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "houseX" INTEGER,
ADD COLUMN     "houseY" INTEGER;

-- CreateTable
CREATE TABLE "Peon" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "taskTile" TEXT,
    "taskType" TEXT,
    "taskStart" TIMESTAMP(3),
    "taskEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peon_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Peon" ADD CONSTRAINT "Peon_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
