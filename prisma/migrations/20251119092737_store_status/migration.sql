/*
  Warnings:

  - The values [PUBLISHED,EDITING,SUSPENDED] on the enum `StorStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StorStatus_new" AS ENUM ('published', 'editing', 'suspended');
ALTER TABLE "public"."Store" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Store" ALTER COLUMN "status" TYPE "StorStatus_new" USING ("status"::text::"StorStatus_new");
ALTER TYPE "StorStatus" RENAME TO "StorStatus_old";
ALTER TYPE "StorStatus_new" RENAME TO "StorStatus";
DROP TYPE "public"."StorStatus_old";
ALTER TABLE "Store" ALTER COLUMN "status" SET DEFAULT 'editing';
COMMIT;

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "status" SET DEFAULT 'editing';
