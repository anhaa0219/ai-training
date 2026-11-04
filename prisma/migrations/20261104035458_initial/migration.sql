-- CreateEnum
CREATE TYPE "Label" AS ENUM ('cat', 'not_cat');

-- CreateEnum
CREATE TYPE "Ground" AS ENUM ('training', 'testing');

-- CreateTable
CREATE TABLE "training-photos" (
    "id" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "label" "Label",
    "ground" "Ground" NOT NULL DEFAULT 'training',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training-photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training-photos_storagePath_key" ON "training-photos"("storagePath");
