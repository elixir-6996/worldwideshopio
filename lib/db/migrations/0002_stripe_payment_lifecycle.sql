ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "payment_status" text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" text,
  ADD COLUMN IF NOT EXISTS "last_stripe_event_id" text,
  ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "payment_updated_at" timestamp with time zone NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "orders_payment_reference_unique"
  ON "orders" ("payment_reference")
  WHERE "payment_reference" IS NOT NULL;

UPDATE "orders"
SET
  "payment_status" = CASE
    WHEN "payment_method" = 'stripe' THEN 'paid'
    ELSE 'paid'
  END,
  "paid_at" = COALESCE("paid_at", "created_at"),
  "payment_updated_at" = COALESCE("payment_updated_at", "created_at")
WHERE "payment_status" = 'pending' AND "payment_reference" IS NOT NULL;
