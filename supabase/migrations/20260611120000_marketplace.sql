-- ============================================================
-- COMMERCE / MARKETPLACE  ("Amazon-like" storefront + seller center)
-- A full B2C/B2B selling layer that sits ON TOP of the existing
-- inventory (inventory_items / stock_snapshot / stock_ledger).
--
-- A marketplace_product is a *listing* — rich storefront content
-- (title, brand, images, bullets, price) that points at an
-- inventory_item (the physical SKU) and a fulfilment warehouse.
-- Selling decrements real stock through post_stock_movement().
-- ============================================================

-- 1. CATEGORIES (browse tree) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  icon          TEXT,                       -- lucide icon name for the storefront nav
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active', -- active|hidden
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, slug)
);

-- 2. PRODUCT LISTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- link to the physical stock SKU (nullable for service/digital listings)
  item_id         UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  warehouse_id    UUID REFERENCES warehouses(id),  -- fulfilment source
  category_id     UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  -- storefront content
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  brand           TEXT,
  short_desc      TEXT,
  description     TEXT,
  bullet_points   JSONB NOT NULL DEFAULT '[]',   -- ["Feature 1", "Feature 2"]
  images          JSONB NOT NULL DEFAULT '[]',   -- [{url, alt, is_primary}]
  attributes      JSONB NOT NULL DEFAULT '{}',   -- {color, size, material, ...}
  tags            JSONB NOT NULL DEFAULT '[]',
  sku             TEXT,                          -- mirror of item.sku for search
  -- pricing (selling side; cost lives on inventory_items.current_cost)
  currency        TEXT NOT NULL DEFAULT 'INR',
  mrp             NUMERIC(18,2) NOT NULL DEFAULT 0,   -- list / strike-through price
  price           NUMERIC(18,2) NOT NULL DEFAULT 0,   -- regular sell price
  sale_price      NUMERIC(18,2),                      -- promo price (if on sale)
  gst_rate        NUMERIC(5,2) NOT NULL DEFAULT 18,
  -- logistics
  weight_kg       NUMERIC(12,3),
  is_cod_available    BOOLEAN NOT NULL DEFAULT TRUE,
  is_returnable       BOOLEAN NOT NULL DEFAULT TRUE,
  return_window_days  INTEGER NOT NULL DEFAULT 7,
  handling_days       INTEGER NOT NULL DEFAULT 1,
  -- merchandising
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_prime        BOOLEAN NOT NULL DEFAULT FALSE,  -- "fast delivery" badge
  rating_avg      NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  units_sold      INTEGER NOT NULL DEFAULT 0,
  view_count      INTEGER NOT NULL DEFAULT 0,
  -- lifecycle
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft|active|inactive|archived
  published_at    TIMESTAMPTZ,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_mkt_products_company ON marketplace_products(company_id, status);
CREATE INDEX IF NOT EXISTS idx_mkt_products_cat     ON marketplace_products(category_id);
CREATE INDEX IF NOT EXISTS idx_mkt_products_item    ON marketplace_products(item_id);

-- 3. PRODUCT VARIANTS (size/colour SKUs under one listing) ─────
CREATE TABLE IF NOT EXISTS marketplace_product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  product_id    UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  item_id       UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,             -- "Red / Large"
  sku           TEXT,
  options       JSONB NOT NULL DEFAULT '{}', -- {color:"Red", size:"L"}
  price         NUMERIC(18,2),             -- overrides product.price when set
  sale_price    NUMERIC(18,2),
  image_url     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_variants_product ON marketplace_product_variants(product_id);

-- 4. STOREFRONT CUSTOMERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  type          TEXT NOT NULL DEFAULT 'b2c',   -- b2c|b2b
  gstin         TEXT,
  addresses     JSONB NOT NULL DEFAULT '[]',   -- [{label,line1,line2,city,state,pin,is_default}]
  total_orders  INTEGER NOT NULL DEFAULT 0,
  total_spent   NUMERIC(18,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_customers_company ON marketplace_customers(company_id);

-- 5. CARTS (server-side, one open cart per session/customer) ──
CREATE TABLE IF NOT EXISTS marketplace_carts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES marketplace_customers(id) ON DELETE CASCADE,
  session_key   TEXT,                       -- for anonymous carts (employee user id / guest)
  items         JSONB NOT NULL DEFAULT '[]',-- [{product_id,variant_id,title,image,price,qty,sku,item_id,warehouse_id}]
  status        TEXT NOT NULL DEFAULT 'open', -- open|converted|abandoned
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_carts_session ON marketplace_carts(company_id, session_key, status);

-- 6. ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_no          TEXT NOT NULL,
  customer_id       UUID REFERENCES marketplace_customers(id),
  customer_name     TEXT NOT NULL,
  customer_email    TEXT,
  customer_phone    TEXT,
  channel           TEXT NOT NULL DEFAULT 'storefront', -- storefront|pos|b2b|api
  -- line items snapshot
  items             JSONB NOT NULL DEFAULT '[]',
  -- [{product_id,variant_id,item_id,warehouse_id,sku,title,image,qty,uom,
  --   unit_price,gst_rate,line_subtotal,line_tax,line_total,fulfilled_qty}]
  warehouse_id      UUID REFERENCES warehouses(id),  -- primary fulfilment WH
  -- money
  currency          TEXT NOT NULL DEFAULT 'INR',
  subtotal          NUMERIC(18,2) NOT NULL DEFAULT 0,
  discount_total    NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_total         NUMERIC(18,2) NOT NULL DEFAULT 0,
  shipping_fee      NUMERIC(18,2) NOT NULL DEFAULT 0,
  platform_fee      NUMERIC(18,2) NOT NULL DEFAULT 0,  -- marketplace commission
  cod_deposit       NUMERIC(18,2) NOT NULL DEFAULT 0,  -- refundable COD deposit
  grand_total       NUMERIC(18,2) NOT NULL DEFAULT 0,
  coupon_code       TEXT,
  -- addresses
  shipping_address  JSONB NOT NULL DEFAULT '{}',
  billing_address   JSONB NOT NULL DEFAULT '{}',
  -- status machine
  order_status      TEXT NOT NULL DEFAULT 'pending',
  -- pending|confirmed|processing|shipped|delivered|completed|cancelled|returned
  payment_status    TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid|paid|refunded|partial|cod_pending
  payment_method    TEXT,                            -- card|upi|netbanking|cod|wallet
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled', -- unfulfilled|partial|fulfilled
  stock_reserved    BOOLEAN NOT NULL DEFAULT FALSE,
  stock_issued      BOOLEAN NOT NULL DEFAULT FALSE,
  -- linkage to inventory goods-issue & accounting
  gi_id             UUID REFERENCES goods_issues(id),
  invoice_no        TEXT,
  tracking_no       TEXT,
  carrier           TEXT,
  -- timestamps
  placed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancel_reason     TEXT,
  notes             TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, order_no)
);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_company ON marketplace_orders(company_id, order_status);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_cust    ON marketplace_orders(customer_id);

-- 7. ORDER TIMELINE / EVENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_order_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  order_id      UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,   -- placed|confirmed|paid|reserved|shipped|delivered|cancelled|refunded|note
  message       TEXT,
  meta          JSONB DEFAULT '{}',
  actor_id      UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_events_order ON marketplace_order_events(order_id, created_at);

-- 8. PRODUCT REVIEWS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  product_id    UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES marketplace_customers(id),
  order_id      UUID REFERENCES marketplace_orders(id),
  author_name   TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         TEXT,
  body          TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'published', -- published|pending|hidden
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_reviews_product ON marketplace_reviews(product_id, status);

-- 9. PER-COMPANY MARKETPLACE SETTINGS (fees & deposits) ───────
CREATE TABLE IF NOT EXISTS marketplace_settings (
  company_id              UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  store_name              TEXT,
  store_tagline           TEXT,
  currency                TEXT NOT NULL DEFAULT 'INR',
  platform_fee_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,   -- commission % of subtotal
  payment_gateway_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 2,   -- PG fee % (online only)
  shipping_flat_fee       NUMERIC(18,2) NOT NULL DEFAULT 49,
  free_shipping_threshold NUMERIC(18,2) NOT NULL DEFAULT 999, -- free shipping over this
  cod_deposit_pct         NUMERIC(5,2) NOT NULL DEFAULT 0,   -- refundable COD deposit %
  cod_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  auto_reserve_on_confirm BOOLEAN NOT NULL DEFAULT TRUE,
  low_stock_hide          BOOLEAN NOT NULL DEFAULT FALSE,    -- hide listings at 0 stock
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (mirrors inventory module pattern) ───
ALTER TABLE marketplace_categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_carts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_settings          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all" ON marketplace_categories       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_products         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_customers        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_carts            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_orders           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_order_events     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_reviews          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON marketplace_settings         FOR ALL USING (true) WITH CHECK (true);

-- 11. STOCK ORCHESTRATION FUNCTIONS ───────────────────────────
-- Reserve stock for every line of an order (increments qty_reserved
-- in stock_snapshot for the line's item+warehouse). Idempotent.
CREATE OR REPLACE FUNCTION mkt_reserve_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_order  marketplace_orders%ROWTYPE;
  v_line   JSONB;
  v_item   UUID;
  v_wh     UUID;
  v_qty    NUMERIC;
BEGIN
  SELECT * INTO v_order FROM marketplace_orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.stock_reserved THEN RETURN; END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_order.items) LOOP
    v_item := NULLIF(v_line->>'item_id','')::UUID;
    v_wh   := COALESCE(NULLIF(v_line->>'warehouse_id','')::UUID, v_order.warehouse_id);
    v_qty  := COALESCE((v_line->>'qty')::NUMERIC, 0);
    IF v_item IS NULL OR v_wh IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    UPDATE stock_snapshot
       SET qty_reserved = qty_reserved + v_qty, updated_at = NOW()
     WHERE company_id = v_order.company_id
       AND item_id = v_item AND warehouse_id = v_wh
       AND bin_id IS NULL AND COALESCE(lot_no,'')='' AND COALESCE(batch_no,'')='';

    -- ensure a snapshot row exists even if none yet (reserve against future stock)
    IF NOT FOUND THEN
      INSERT INTO stock_snapshot (company_id, item_id, warehouse_id, qty_on_hand, qty_reserved)
      VALUES (v_order.company_id, v_item, v_wh, 0, v_qty)
      ON CONFLICT (company_id, item_id, warehouse_id, bin_id, lot_no, batch_no) DO NOTHING;
    END IF;
  END LOOP;

  UPDATE marketplace_orders SET stock_reserved = TRUE, updated_at = NOW() WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Release a reservation (on cancel before fulfilment).
CREATE OR REPLACE FUNCTION mkt_release_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_order  marketplace_orders%ROWTYPE;
  v_line   JSONB;
  v_item   UUID; v_wh UUID; v_qty NUMERIC;
BEGIN
  SELECT * INTO v_order FROM marketplace_orders WHERE id = p_order_id;
  IF NOT FOUND OR NOT v_order.stock_reserved OR v_order.stock_issued THEN RETURN; END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_order.items) LOOP
    v_item := NULLIF(v_line->>'item_id','')::UUID;
    v_wh   := COALESCE(NULLIF(v_line->>'warehouse_id','')::UUID, v_order.warehouse_id);
    v_qty  := COALESCE((v_line->>'qty')::NUMERIC, 0);
    IF v_item IS NULL OR v_wh IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    UPDATE stock_snapshot
       SET qty_reserved = GREATEST(qty_reserved - v_qty, 0), updated_at = NOW()
     WHERE company_id = v_order.company_id
       AND item_id = v_item AND warehouse_id = v_wh
       AND bin_id IS NULL AND COALESCE(lot_no,'')='' AND COALESCE(batch_no,'')='';
  END LOOP;

  UPDATE marketplace_orders SET stock_reserved = FALSE, updated_at = NOW() WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Fulfil (ship) an order: post a real GI stock movement for each line
-- through the existing post_stock_movement(), release the reservation,
-- bump units_sold, and link a goods_issue record. Idempotent.
CREATE OR REPLACE FUNCTION mkt_fulfill_order(p_order_id UUID, p_actor UUID)
RETURNS VOID AS $$
DECLARE
  v_order  marketplace_orders%ROWTYPE;
  v_line   JSONB;
  v_item   UUID; v_wh UUID; v_qty NUMERIC; v_uom TEXT; v_rate NUMERIC;
BEGIN
  SELECT * INTO v_order FROM marketplace_orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.stock_issued THEN RETURN; END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_order.items) LOOP
    v_item := NULLIF(v_line->>'item_id','')::UUID;
    v_wh   := COALESCE(NULLIF(v_line->>'warehouse_id','')::UUID, v_order.warehouse_id);
    v_qty  := COALESCE((v_line->>'qty')::NUMERIC, 0);
    v_uom  := COALESCE(v_line->>'uom', 'PCS');
    v_rate := COALESCE((v_line->>'unit_price')::NUMERIC, 0);
    IF v_item IS NULL OR v_wh IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    -- free the reservation first so post_stock_movement sees true on-hand
    UPDATE stock_snapshot
       SET qty_reserved = GREATEST(qty_reserved - v_qty, 0)
     WHERE company_id = v_order.company_id AND item_id = v_item AND warehouse_id = v_wh
       AND bin_id IS NULL AND COALESCE(lot_no,'')='' AND COALESCE(batch_no,'')='';

    PERFORM post_stock_movement(
      v_order.company_id, v_item, v_wh, NULL, NULL, NULL,
      'GI', COALESCE(v_order.shipped_at::DATE, CURRENT_DATE),
      v_qty, v_uom, v_rate,
      'SO', v_order.id, v_order.order_no,
      'Marketplace order ' || v_order.order_no, p_actor
    );

    UPDATE marketplace_products
       SET units_sold = units_sold + v_qty::INT, updated_at = NOW()
     WHERE id = NULLIF(v_line->>'product_id','')::UUID;
  END LOOP;

  UPDATE marketplace_orders
     SET stock_issued = TRUE, stock_reserved = FALSE,
         fulfillment_status = 'fulfilled', updated_at = NOW()
   WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Recompute a product's rating aggregate when reviews change.
CREATE OR REPLACE FUNCTION mkt_refresh_rating(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_products p
     SET rating_avg = COALESCE((
           SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM marketplace_reviews r
            WHERE r.product_id = p_product_id AND r.status = 'published'), 0),
         rating_count = COALESCE((
           SELECT COUNT(*) FROM marketplace_reviews r
            WHERE r.product_id = p_product_id AND r.status = 'published'), 0),
         updated_at = NOW()
   WHERE p.id = p_product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mkt_review_aiud() RETURNS TRIGGER AS $$
BEGIN
  PERFORM mkt_refresh_rating(COALESCE(NEW.product_id, OLD.product_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mkt_review_rating ON marketplace_reviews;
CREATE TRIGGER trg_mkt_review_rating
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION mkt_review_aiud();

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION mkt_touch_updated() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mkt_products_touch ON marketplace_products;
CREATE TRIGGER trg_mkt_products_touch BEFORE UPDATE ON marketplace_products
  FOR EACH ROW EXECUTE FUNCTION mkt_touch_updated();
DROP TRIGGER IF EXISTS trg_mkt_orders_touch ON marketplace_orders;
CREATE TRIGGER trg_mkt_orders_touch BEFORE UPDATE ON marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION mkt_touch_updated();
