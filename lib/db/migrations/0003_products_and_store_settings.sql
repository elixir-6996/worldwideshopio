CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "category" text NOT NULL,
  "price" integer NOT NULL,
  "original_price" integer,
  "images" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "sizes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "colors" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "rating" double precision NOT NULL DEFAULT 0,
  "reviews" integer NOT NULL DEFAULT 0,
  "in_stock" boolean NOT NULL DEFAULT true,
  "badge" text,
  "status" text NOT NULL DEFAULT 'draft',
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");
CREATE INDEX IF NOT EXISTS "products_status_sort_idx" ON "products" ("status", "sort_order");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category");

CREATE TABLE IF NOT EXISTS "store_settings" (
  "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
  "store_name" text NOT NULL DEFAULT 'LUXE',
  "tagline" text NOT NULL DEFAULT '',
  "support_email" text NOT NULL DEFAULT '',
  "currency" text NOT NULL DEFAULT 'USD',
  "free_shipping_threshold" integer NOT NULL DEFAULT 200,
  "standard_shipping_rate" integer NOT NULL DEFAULT 15,
  "express_shipping_rate" integer NOT NULL DEFAULT 30,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "store_settings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
