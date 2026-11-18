-- DropIndex
DROP INDEX "Refugee_externalId_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Need" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refugeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "costAed" REAL,
    "stockLeft" INTEGER NOT NULL,
    "dailyUse" INTEGER NOT NULL,
    "fundedAed" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "Need_refugeeId_fkey" FOREIGN KEY ("refugeeId") REFERENCES "Refugee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Need" ("category", "costAed", "dailyUse", "fundedAed", "id", "item", "refugeeId", "status", "stockLeft") SELECT "category", "costAed", "dailyUse", "fundedAed", "id", "item", "refugeeId", "status", "stockLeft" FROM "Need";
DROP TABLE "Need";
ALTER TABLE "new_Need" RENAME TO "Need";
CREATE INDEX "Need_status_category_idx" ON "Need"("status", "category");
CREATE INDEX "Need_refugeeId_idx" ON "Need"("refugeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Refugee_externalId_idx" ON "Refugee"("externalId");
