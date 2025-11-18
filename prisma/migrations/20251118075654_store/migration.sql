-- CreateEnum
CREATE TYPE "StorStatus" AS ENUM ('PUBLISHED', 'EDITING', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Store" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kanaName" VARCHAR(255),
    "status" "StorStatus" NOT NULL DEFAULT 'EDITING',
    "zipCode" VARCHAR(8),
    "email" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "prefecture" VARCHAR(255),
    "phoneNumber" VARCHAR(13) NOT NULL,
    "businessHours" VARCHAR(255),
    "holidays" TEXT[],
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(0) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
