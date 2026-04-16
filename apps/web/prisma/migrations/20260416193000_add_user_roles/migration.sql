ALTER TABLE "User" ADD COLUMN "roles" "Role"[] NOT NULL DEFAULT ARRAY['USER']::"Role"[];

UPDATE "User"
SET "roles" = ARRAY["role"]::"Role"[];
