-- CreateTable
CREATE TABLE "OpsAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "merchantId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpsAccount_username_key" ON "OpsAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "OpsAccount_userId_key" ON "OpsAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OpsSession_token_key" ON "OpsSession"("token");

-- CreateIndex
CREATE INDEX "OpsSession_userId_idx" ON "OpsSession"("userId");

-- CreateIndex
CREATE INDEX "OpsSession_expiresAt_idx" ON "OpsSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "OpsAccount" ADD CONSTRAINT "OpsAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsSession" ADD CONSTRAINT "OpsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
