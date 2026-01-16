-- Apply cascade delete for manager aliases and add lookup index.
ALTER TABLE "ManagerAlias" DROP CONSTRAINT "ManagerAlias_userId_fkey";
ALTER TABLE "ManagerAlias"
  ADD CONSTRAINT "ManagerAlias_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ManagerAlias_userId_idx" ON "ManagerAlias"("userId");
