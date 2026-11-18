-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT NOT NULL,
    "amountAed" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Donation_status_check" CHECK ("status" IN ('PENDING', 'DISTRIBUTED')),
    CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ngo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Refugee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ngoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Refugee_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "Ngo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Need" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refugeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "costAed" REAL NOT NULL,
    "stockLeft" INTEGER NOT NULL,
    "dailyUse" INTEGER NOT NULL,
    "fundedAed" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "Need_category_check" CHECK ("category" IN ('FOOD', 'MEDICINE', 'SHELTER')),
    CONSTRAINT "Need_status_check" CHECK ("status" IN ('OPEN', 'FUNDED')),
    CONSTRAINT "Need_refugeeId_fkey" FOREIGN KEY ("refugeeId") REFERENCES "Refugee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "needId" TEXT NOT NULL,
    "ngoId" TEXT NOT NULL,
    "amountAed" REAL NOT NULL,
    "spentAed" REAL NOT NULL DEFAULT 0,
    "distributionRunId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Allocation_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allocation_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "Ngo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Allocation_distributionRunId_fkey" FOREIGN KEY ("distributionRunId") REFERENCES "DistributionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DistributionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalDistributedAed" REAL NOT NULL,
    "totalDonationsCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ngoId" TEXT,
    "refugeeId" TEXT,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FraudFlag_type_check" CHECK ("type" IN ('DUPLICATE_RECORD', 'UNUSUAL_PATTERN', 'NO_PROOF_OF_NEED', 'NO_PROOF_OF_SPEND')),
    CONSTRAINT "FraudFlag_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "Ngo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FraudFlag_refugeeId_fkey" FOREIGN KEY ("refugeeId") REFERENCES "Refugee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Donor_email_key" ON "Donor"("email");

-- CreateIndex
CREATE INDEX "Donation_status_createdAt_idx" ON "Donation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Ngo_verified_idx" ON "Ngo"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "Refugee_externalId_key" ON "Refugee"("externalId");

-- CreateIndex
CREATE INDEX "Refugee_ngoId_idx" ON "Refugee"("ngoId");

-- CreateIndex
CREATE INDEX "Need_status_category_idx" ON "Need"("status", "category");

-- CreateIndex
CREATE INDEX "Need_refugeeId_idx" ON "Need"("refugeeId");

-- CreateIndex
CREATE INDEX "Allocation_distributionRunId_idx" ON "Allocation"("distributionRunId");

-- CreateIndex
CREATE INDEX "Allocation_ngoId_idx" ON "Allocation"("ngoId");

-- CreateIndex
CREATE INDEX "Allocation_needId_idx" ON "Allocation"("needId");

-- CreateIndex
CREATE INDEX "FraudFlag_ngoId_idx" ON "FraudFlag"("ngoId");

-- CreateIndex
CREATE INDEX "FraudFlag_refugeeId_idx" ON "FraudFlag"("refugeeId");

-- CreateIndex
CREATE INDEX "FraudFlag_type_idx" ON "FraudFlag"("type");
