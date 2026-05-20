-- AlterEnum
-- New enum values must be added in their own committed migration before
-- they can be used (e.g. as a column default). Postgres refuses
-- `ALTER TYPE ... ADD VALUE` + use-of-that-value in the same transaction.

ALTER TYPE "auth_provider" ADD VALUE IF NOT EXISTS 'internal';
ALTER TYPE "auth_provider" ADD VALUE IF NOT EXISTS 'github';
