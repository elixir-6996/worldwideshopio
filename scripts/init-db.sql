-- Idempotent schema setup for the LUXE storefront.
-- Mirrors lib/db/schema.ts. Safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS checkout_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_token text NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  first_name text NOT NULL,
  last_name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  checkout_token text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  payment_method text NOT NULL,
  payment_reference text UNIQUE,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  last_stripe_event_id text,
  paid_at timestamptz,
  payment_updated_at timestamptz NOT NULL DEFAULT now(),
  subtotal integer NOT NULL,
  discount integer NOT NULL DEFAULT 0,
  shipping integer NOT NULL DEFAULT 0,
  shipping_savings integer NOT NULL DEFAULT 0,
  tax integer NOT NULL DEFAULT 0,
  total integer NOT NULL,
  coupon text,
  delivery_method text NOT NULL,
  address jsonb NOT NULL,
  items jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL,
  value integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  minimum_order_value integer NOT NULL DEFAULT 0,
  first_order_only boolean NOT NULL DEFAULT false,
  free_shipping boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupons_active_code_idx ON coupons (code);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  coupon_code text NOT NULL,
  order_id uuid NOT NULL UNIQUE,
  order_number text NOT NULL,
  customer_email text NOT NULL,
  discount_amount integer NOT NULL DEFAULT 0,
  shipping_savings integer NOT NULL DEFAULT 0,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupon_redemptions_email_idx
  ON coupon_redemptions (customer_email, redeemed_at);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  birthday text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  first_name text NOT NULL,
  last_name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text NOT NULL,
  product_price integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_wishlist_email_product_id_unique UNIQUE (email, product_id)
);

CREATE TABLE IF NOT EXISTS customer_preferences (
  email text PRIMARY KEY,
  order_updates boolean NOT NULL DEFAULT true,
  promotions boolean NOT NULL DEFAULT false,
  new_arrivals boolean NOT NULL DEFAULT true,
  sms_updates boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  brand text NOT NULL,
  last_four text NOT NULL,
  expiry_month integer NOT NULL,
  expiry_year integer NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  order_id uuid NOT NULL,
  reason text NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);
