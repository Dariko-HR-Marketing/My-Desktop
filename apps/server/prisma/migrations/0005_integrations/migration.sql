-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "dataEnc" TEXT NOT NULL,
    "lastTestOk" BOOLEAN,
    "lastTestAt" TIMESTAMP(3),
    "lastTestMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_ownerId_providerKey_key" ON "Integration"("ownerId", "providerKey");
