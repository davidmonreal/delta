-- Create ManagerAlias table if it does not exist yet.
CREATE TABLE "ManagerAlias" (
  "id" SERIAL PRIMARY KEY,
  "alias" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "ManagerAlias_alias_key" UNIQUE ("alias")
);

ALTER TABLE "ManagerAlias"
  ADD CONSTRAINT "ManagerAlias_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
