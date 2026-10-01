ALTER TABLE "BookingRequest"
  ALTER COLUMN "status" SET DEFAULT 'awaiting_payment',
  ADD COLUMN "amountCents" INTEGER,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'eur',
  ADD COLUMN "stripeSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "checkoutExpiresAt" TIMESTAMP(3),
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "notifiedAt" TIMESTAMP(3),
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "BookingRequest_stripeSessionId_key" ON "BookingRequest"("stripeSessionId");
CREATE UNIQUE INDEX "BookingRequest_stripePaymentIntentId_key" ON "BookingRequest"("stripePaymentIntentId");
