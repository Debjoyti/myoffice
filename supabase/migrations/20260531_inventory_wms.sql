-- ============================================================
-- INVENTORY & WAREHOUSE MANAGEMENT SYSTEM
-- End-to-end schema: items, warehouses, bins, stock ledger,
-- PR, PO, GRN, GI, STO, import shipments, physical inventory
-- ============================================================

-- 1. ITEM MASTER ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sku              TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL, -- Raw Material|WIP|Finished Goods|Spare Parts|Trading|Consumable|Capital Item
  sub_category     TEXT,
  item_type        TEXT NOT NULL DEFAULT 'domestic', -- domestic|imported|both
  uom              TEXT NOT NULL, -- PCS|KG|MTR|LTR|BOX|SET|NOS|BTL|SHT|TON
  secondary_uom    TEXT,
  uom_conversion   NUMERIC(18,6) DEFAULT 1, -- qty in secondary_uom per primary
  hsn_code         TEXT,
  gst_rate         NUMERIC(5,2) DEFAULT 18,
  valuation_method TEXT NOT NULL DEFAULT 'moving_avg', -- fifo|moving_avg|standard_cost
  standard_cost    NUMERIC(18,2) DEFAULT 0,
  current_cost     NUMERIC(18,2) DEFAULT 0,  -- updated on GRN
  reorder_level    NUMERIC(18,3) DEFAULT 0,
  reorder_qty      NUMERIC(18,3) DEFAULT 0,
  safety_stock     NUMERIC(18,3) DEFAULT 0,
  max_stock        NUMERIC(18,3) DEFAULT 0,
  lead_time_days   INTEGER DEFAULT 7,
  lot_controlled   BOOLEAN DEFAULT FALSE,
  batch_controlled BOOLEAN DEFAULT FALSE,
  serial_controlled BOOLEAN DEFAULT FALSE,
  shelf_life_days  INTEGER,
  weight_kg        NUMERIC(12,3),
  length_cm        NUMERIC(10,2),
  width_cm         NUMERIC(10,2),
  height_cm        NUMERIC(10,2),
  country_of_origin TEXT,
  customs_tariff   TEXT,   -- HS code for imports
  image_url        TEXT,
  status           TEXT NOT NULL DEFAULT 'active', -- active|inactive|obsolete|under_review
  created_by       UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, sku)
);

-- 2. WAREHOUSES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'general', -- general|raw_material|finished_goods|bonded|transit|quarantine
  address          TEXT,
  city             TEXT,
  state            TEXT,
  pin_code         TEXT,
  country          TEXT DEFAULT 'India',
  gstin            TEXT,
  manager_id       UUID,  -- references employees
  area_sqft        NUMERIC(10,2),
  has_bin_mgmt     BOOLEAN DEFAULT FALSE,
  is_bonded        BOOLEAN DEFAULT FALSE,  -- bonded warehouse for imports
  temp_controlled  BOOLEAN DEFAULT FALSE,
  temp_min_c       NUMERIC(5,1),
  temp_max_c       NUMERIC(5,1),
  status           TEXT NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, code)
);

-- 3. WAREHOUSE BINS (Bin-level storage) ──────────────────────
CREATE TABLE IF NOT EXISTS warehouse_bins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id   UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  company_id     UUID NOT NULL,
  bin_code       TEXT NOT NULL,  -- e.g. A-01-B-03 (Zone-Aisle-Rack-Level)
  zone           TEXT,
  aisle          TEXT,
  rack           TEXT,
  level          TEXT,
  bin_type       TEXT DEFAULT 'storage', -- storage|receiving|dispatch|staging|quarantine|rejection
  max_weight_kg  NUMERIC(10,2),
  capacity_units INTEGER,
  length_cm      NUMERIC(8,2),
  width_cm       NUMERIC(8,2),
  height_cm      NUMERIC(8,2),
  status         TEXT DEFAULT 'active',
  UNIQUE (warehouse_id, bin_code)
);

-- 4. STOCK SNAPSHOT (current qty per item/warehouse/bin) ─────
CREATE TABLE IF NOT EXISTS stock_snapshot (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL,
  item_id         UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  bin_id          UUID REFERENCES warehouse_bins(id),
  lot_no          TEXT,
  batch_no        TEXT,
  expiry_date     DATE,
  qty_on_hand     NUMERIC(18,3) NOT NULL DEFAULT 0,
  qty_reserved    NUMERIC(18,3) NOT NULL DEFAULT 0, -- qty reserved for SO/WO
  qty_in_transit  NUMERIC(18,3) NOT NULL DEFAULT 0, -- in transit (STO out)
  qty_in_qa       NUMERIC(18,3) NOT NULL DEFAULT 0, -- under inspection
  valuation_rate  NUMERIC(18,4) DEFAULT 0,
  stock_value     NUMERIC(18,2) DEFAULT 0,
  last_movement   TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, item_id, warehouse_id, bin_id, lot_no, batch_no)
);

-- 5. STOCK LEDGER (immutable audit trail of every movement) ──
CREATE TABLE IF NOT EXISTS stock_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL,
  item_id         UUID NOT NULL REFERENCES inventory_items(id),
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  bin_id          UUID REFERENCES warehouse_bins(id),
  lot_no          TEXT,
  batch_no        TEXT,
  serial_no       TEXT,
  expiry_date     DATE,
  movement_type   TEXT NOT NULL, -- GR|GI|STO_OUT|STO_IN|ADJ_PLUS|ADJ_MINUS|RETURN_IN|RETURN_OUT|SCRAP|OPENING|TRANSFER_IN|TRANSFER_OUT
  movement_date   DATE NOT NULL,
  qty             NUMERIC(18,3) NOT NULL,  -- always positive; direction from movement_type
  uom             TEXT NOT NULL,
  rate            NUMERIC(18,4),           -- per unit cost at time of movement
  amount          NUMERIC(18,2),
  balance_qty     NUMERIC(18,3),           -- running qty in that warehouse after this entry
  reference_type  TEXT,  -- PR|PO|GRN|GI|STO|WO|SO|ADJ|IMPORT|COUNT
  reference_id    UUID,
  reference_no    TEXT,
  narration       TEXT,
  posted_by       UUID,  -- employee id
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_cancelled    BOOLEAN DEFAULT FALSE,
  cancelled_by    UUID,
  cancelled_at    TIMESTAMPTZ
);
-- Index for fast ledger queries
CREATE INDEX IF NOT EXISTS idx_stock_ledger_item ON stock_ledger(company_id, item_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_ref  ON stock_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_date ON stock_ledger(company_id, movement_date DESC);

-- 6. PURCHASE REQUESTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pr_no            TEXT NOT NULL,
  requested_by     UUID NOT NULL,  -- employee id
  department       TEXT,
  request_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date    DATE,
  priority         TEXT DEFAULT 'normal', -- urgent|high|normal|low
  request_type     TEXT DEFAULT 'domestic', -- domestic|import
  items            JSONB NOT NULL DEFAULT '[]',
  -- items: [{item_id, sku, name, qty, uom, estimated_rate, estimated_amount, remarks}]
  total_estimated_value  NUMERIC(18,2) DEFAULT 0,
  remarks          TEXT,
  justification    TEXT,
  attachments      JSONB DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'draft',
  -- draft|submitted|under_review|approved|partially_ordered|fully_ordered|rejected|cancelled
  submitted_at     TIMESTAMPTZ,
  approved_by      UUID,
  approved_at      TIMESTAMPTZ,
  rejected_by      UUID,
  rejected_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, pr_no)
);

-- 7. PURCHASE ORDERS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  po_no             TEXT NOT NULL,
  pr_id             UUID REFERENCES purchase_requests(id),
  pr_no             TEXT,
  vendor_id         UUID,
  vendor_name       TEXT NOT NULL,
  vendor_gstin      TEXT,
  vendor_pan        TEXT,
  po_type           TEXT NOT NULL DEFAULT 'domestic', -- domestic|import
  currency          TEXT NOT NULL DEFAULT 'INR',
  exchange_rate     NUMERIC(10,4) DEFAULT 1,
  incoterms         TEXT,  -- FOB|CIF|EXW|DAP|DDP (for imports)
  port_of_loading   TEXT,
  port_of_discharge TEXT,
  payment_terms     TEXT,
  delivery_terms    TEXT,
  po_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date     DATE,
  delivery_address  TEXT,
  delivery_warehouse_id UUID REFERENCES warehouses(id),
  items             JSONB NOT NULL DEFAULT '[]',
  -- items: [{item_id, sku, name, qty, uom, rate, gst_rate, amount, received_qty, pending_qty}]
  subtotal_foreign  NUMERIC(18,2),   -- in foreign currency (for imports)
  subtotal_inr      NUMERIC(18,2) DEFAULT 0,
  tax_amount        NUMERIC(18,2) DEFAULT 0,
  freight_charges   NUMERIC(18,2) DEFAULT 0,
  insurance         NUMERIC(18,2) DEFAULT 0,
  other_charges     NUMERIC(18,2) DEFAULT 0,
  total_amount      NUMERIC(18,2) DEFAULT 0,
  landed_cost       NUMERIC(18,2),   -- total landed for imports
  status            TEXT NOT NULL DEFAULT 'draft',
  -- draft|approved|sent_to_vendor|acknowledged|partially_received|received|closed|cancelled
  notes             TEXT,
  terms_conditions  TEXT,
  attachments       JSONB DEFAULT '[]',
  submitted_at      TIMESTAMPTZ,
  approved_by       UUID,
  approved_at       TIMESTAMPTZ,
  sent_to_vendor_at TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, po_no)
);

-- 8. GOODS RECEIPTS (GRN) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS goods_receipts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  grn_no             TEXT NOT NULL,
  po_id              UUID REFERENCES purchase_orders(id),
  po_no              TEXT,
  vendor_id          UUID,
  vendor_name        TEXT,
  receipt_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_no         TEXT,
  lr_no              TEXT,       -- Lorry Receipt / Airway Bill
  bl_no              TEXT,       -- Bill of Lading (for imports)
  invoice_no         TEXT,       -- Vendor invoice number
  invoice_date       DATE,
  invoice_amount     NUMERIC(18,2),
  warehouse_id       UUID REFERENCES warehouses(id),
  items              JSONB NOT NULL DEFAULT '[]',
  -- items: [{item_id, sku, name, po_qty, received_qty, accepted_qty, rejected_qty,
  --          uom, rate, gst_rate, amount, bin_id, lot_no, batch_no, expiry_date, remarks}]
  total_received_value NUMERIC(18,2) DEFAULT 0,
  inspection_required  BOOLEAN DEFAULT TRUE,
  inspection_status    TEXT DEFAULT 'pending', -- pending|in_progress|passed|failed|conditional
  qc_notes             TEXT,
  qc_done_by           UUID,
  qc_done_at           TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'draft',
  -- draft|received|under_inspection|accepted|partially_rejected|rejected|posted|cancelled
  posted_by            UUID,
  posted_at            TIMESTAMPTZ,
  notes                TEXT,
  attachments          JSONB DEFAULT '[]',
  created_by           UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, grn_no)
);

-- 9. GOODS ISSUES (GI) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goods_issues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  gi_no             TEXT NOT NULL,
  issue_type        TEXT NOT NULL, -- production|sales_delivery|project|cost_center|sample|scrap|return_to_vendor
  reference_type    TEXT,          -- WO|SO|PROJECT|COST_CENTER|MANUAL
  reference_id      UUID,
  reference_no      TEXT,
  issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  from_bin_id       UUID REFERENCES warehouse_bins(id),
  department        TEXT,
  issued_to         TEXT,
  items             JSONB NOT NULL DEFAULT '[]',
  -- items: [{item_id, sku, name, qty, uom, rate, amount, bin_id, lot_no, batch_no}]
  total_value       NUMERIC(18,2) DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'draft',
  -- draft|approved|posted|cancelled
  approved_by       UUID,
  approved_at       TIMESTAMPTZ,
  posted_by         UUID,
  posted_at         TIMESTAMPTZ,
  notes             TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, gi_no)
);

-- 10. STOCK TRANSFER ORDERS (STO) ─────────────────────────────
CREATE TABLE IF NOT EXISTS stock_transfers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sto_no             TEXT NOT NULL,
  from_warehouse_id  UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  from_bin_id        UUID REFERENCES warehouse_bins(id),
  to_bin_id          UUID REFERENCES warehouse_bins(id),
  transfer_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_arrival   DATE,
  items              JSONB NOT NULL DEFAULT '[]',
  total_value        NUMERIC(18,2) DEFAULT 0,
  transport_mode     TEXT,  -- road|rail|air|sea
  vehicle_no         TEXT,
  lr_no              TEXT,
  status             TEXT NOT NULL DEFAULT 'draft',
  -- draft|approved|dispatched|in_transit|received|cancelled
  dispatched_at      TIMESTAMPTZ,
  dispatched_by      UUID,
  received_at        TIMESTAMPTZ,
  received_by        UUID,
  notes              TEXT,
  created_by         UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, sto_no)
);

-- 11. IMPORT SHIPMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_shipments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shipment_no         TEXT NOT NULL,
  po_id               UUID REFERENCES purchase_orders(id),
  po_no               TEXT,
  supplier_name       TEXT NOT NULL,
  supplier_country    TEXT NOT NULL,
  incoterms           TEXT, -- FOB|CIF|EXW|DAP|DDP|FCA
  currency            TEXT DEFAULT 'USD',
  invoice_no_foreign  TEXT,
  invoice_value_foreign NUMERIC(18,2),
  exchange_rate       NUMERIC(10,4),
  invoice_value_inr   NUMERIC(18,2),
  -- Shipping details
  vessel_name         TEXT,
  voyage_no           TEXT,
  bl_no               TEXT,
  awb_no              TEXT,  -- for air shipments
  container_no        TEXT,
  container_size      TEXT,
  transport_mode      TEXT DEFAULT 'sea', -- sea|air|road|rail
  port_of_loading     TEXT,
  port_of_discharge   TEXT DEFAULT 'INNSA', -- Nhava Sheva
  etd                 DATE,  -- Estimated Time of Departure
  eta                 DATE,  -- Estimated Time of Arrival
  ata                 DATE,  -- Actual Time of Arrival
  -- Customs
  be_no               TEXT,  -- Bill of Entry number
  be_date             DATE,
  customs_duty        NUMERIC(18,2) DEFAULT 0,
  cvd                 NUMERIC(18,2) DEFAULT 0,  -- Countervailing Duty
  sad                 NUMERIC(18,2) DEFAULT 0,  -- Special Additional Duty
  igst_on_import      NUMERIC(18,2) DEFAULT 0,
  social_welfare_surcharge NUMERIC(18,2) DEFAULT 0,
  custom_cess         NUMERIC(18,2) DEFAULT 0,
  -- Other charges
  freight_charges     NUMERIC(18,2) DEFAULT 0,
  insurance           NUMERIC(18,2) DEFAULT 0,
  cha_charges         NUMERIC(18,2) DEFAULT 0,  -- CHA agent fees
  port_charges        NUMERIC(18,2) DEFAULT 0,
  other_charges       NUMERIC(18,2) DEFAULT 0,
  total_landed_cost   NUMERIC(18,2),
  -- Delivery
  delivery_warehouse_id UUID REFERENCES warehouses(id),
  grn_id              UUID REFERENCES goods_receipts(id),
  grn_no              TEXT,
  -- Status
  status              TEXT NOT NULL DEFAULT 'ordered',
  -- ordered|shipped|at_port|at_customs|customs_cleared|in_transit|delivered|cancelled
  documents           JSONB DEFAULT '[]',
  -- [{type: 'Invoice'|'BL'|'Packing List'|'COO'|'COA'|'Insurance', url, uploaded_at}]
  notes               TEXT,
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, shipment_no)
);

-- 12. PHYSICAL INVENTORY (Stock Count) ────────────────────────
CREATE TABLE IF NOT EXISTS physical_inventory (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  count_no         TEXT NOT NULL,
  count_type       TEXT NOT NULL, -- full|cycle|spot
  warehouse_id     UUID NOT NULL REFERENCES warehouses(id),
  zone             TEXT,
  count_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  freeze_date      DATE,   -- date stock was frozen for counting
  items            JSONB NOT NULL DEFAULT '[]',
  -- items: [{item_id, sku, name, bin_id, lot_no,
  --          system_qty, counted_qty_1, counted_qty_2, final_qty,
  --          variance_qty, variance_value, status, remarks}]
  total_items      INTEGER DEFAULT 0,
  items_matched    INTEGER DEFAULT 0,
  items_variance   INTEGER DEFAULT 0,
  total_variance_value NUMERIC(18,2) DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'planned',
  -- planned|in_progress|counted|under_review|approved|posted|cancelled
  counted_by       UUID,
  counted_at       TIMESTAMPTZ,
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  approved_by      UUID,
  approved_at      TIMESTAMPTZ,
  posted_by        UUID,
  posted_at        TIMESTAMPTZ,
  notes            TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, count_no)
);

-- 13. ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE inventory_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_bins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_snapshot      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_issues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_shipments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_inventory  ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes)
CREATE POLICY "service_all" ON inventory_items    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON warehouses         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON warehouse_bins     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON stock_snapshot     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON stock_ledger       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON purchase_requests  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON purchase_orders    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON goods_receipts     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON goods_issues       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON stock_transfers    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON import_shipments   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON physical_inventory FOR ALL USING (true) WITH CHECK (true);

-- 14. HELPER FUNCTION: post stock movement ────────────────────
CREATE OR REPLACE FUNCTION post_stock_movement(
  p_company_id      UUID,
  p_item_id         UUID,
  p_warehouse_id    UUID,
  p_bin_id          UUID,
  p_lot_no          TEXT,
  p_batch_no        TEXT,
  p_movement_type   TEXT,
  p_movement_date   DATE,
  p_qty             NUMERIC,
  p_uom             TEXT,
  p_rate            NUMERIC,
  p_reference_type  TEXT,
  p_reference_id    UUID,
  p_reference_no    TEXT,
  p_narration       TEXT,
  p_posted_by       UUID
) RETURNS UUID AS $$
DECLARE
  v_ledger_id  UUID;
  v_balance    NUMERIC;
  v_direction  INTEGER; -- +1 or -1
BEGIN
  -- Determine direction
  v_direction := CASE p_movement_type
    WHEN 'GR'          THEN 1
    WHEN 'GI'          THEN -1
    WHEN 'STO_OUT'     THEN -1
    WHEN 'STO_IN'      THEN 1
    WHEN 'ADJ_PLUS'    THEN 1
    WHEN 'ADJ_MINUS'   THEN -1
    WHEN 'RETURN_IN'   THEN 1
    WHEN 'RETURN_OUT'  THEN -1
    WHEN 'SCRAP'       THEN -1
    WHEN 'OPENING'     THEN 1
    WHEN 'TRANSFER_IN' THEN 1
    WHEN 'TRANSFER_OUT'THEN -1
    ELSE 0
  END;

  -- Calculate running balance from snapshot
  SELECT COALESCE(qty_on_hand, 0) INTO v_balance
  FROM stock_snapshot
  WHERE company_id = p_company_id
    AND item_id    = p_item_id
    AND warehouse_id = p_warehouse_id
    AND (bin_id = p_bin_id OR (bin_id IS NULL AND p_bin_id IS NULL))
    AND COALESCE(lot_no,'') = COALESCE(p_lot_no,'')
    AND COALESCE(batch_no,'') = COALESCE(p_batch_no,'');

  v_balance := v_balance + (p_qty * v_direction);

  -- Prevent negative stock (optional enforcement)
  IF v_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient stock: balance would be %', v_balance;
  END IF;

  -- Insert ledger entry
  INSERT INTO stock_ledger (
    company_id, item_id, warehouse_id, bin_id, lot_no, batch_no,
    movement_type, movement_date, qty, uom, rate, amount,
    balance_qty, reference_type, reference_id, reference_no,
    narration, posted_by
  ) VALUES (
    p_company_id, p_item_id, p_warehouse_id, p_bin_id, p_lot_no, p_batch_no,
    p_movement_type, p_movement_date, p_qty, p_uom, p_rate, (p_qty * p_rate),
    v_balance, p_reference_type, p_reference_id, p_reference_no,
    p_narration, p_posted_by
  ) RETURNING id INTO v_ledger_id;

  -- Update snapshot (upsert)
  INSERT INTO stock_snapshot (
    company_id, item_id, warehouse_id, bin_id, lot_no, batch_no,
    qty_on_hand, valuation_rate, stock_value, last_movement
  ) VALUES (
    p_company_id, p_item_id, p_warehouse_id, p_bin_id, p_lot_no, p_batch_no,
    v_balance, p_rate, (v_balance * p_rate), NOW()
  )
  ON CONFLICT (company_id, item_id, warehouse_id, bin_id, lot_no, batch_no)
  DO UPDATE SET
    qty_on_hand    = v_balance,
    valuation_rate = CASE WHEN EXCLUDED.valuation_rate > 0 THEN EXCLUDED.valuation_rate ELSE stock_snapshot.valuation_rate END,
    stock_value    = v_balance * CASE WHEN EXCLUDED.valuation_rate > 0 THEN EXCLUDED.valuation_rate ELSE stock_snapshot.valuation_rate END,
    last_movement  = NOW(),
    updated_at     = NOW();

  -- Also update item current_cost (moving average) on GR
  IF p_movement_type = 'GR' AND p_rate > 0 THEN
    UPDATE inventory_items
    SET current_cost = (
      SELECT COALESCE(
        SUM(stock_value) / NULLIF(SUM(qty_on_hand), 0),
        p_rate
      )
      FROM stock_snapshot
      WHERE item_id = p_item_id AND company_id = p_company_id
    ),
    updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  RETURN v_ledger_id;
END;
$$ LANGUAGE plpgsql;

-- 15. SEQUENCE NUMBERS helper (auto-increment per company) ────
CREATE TABLE IF NOT EXISTS sequence_counters (
  company_id   UUID NOT NULL,
  entity       TEXT NOT NULL, -- pr|po|grn|gi|sto|import|count
  last_no      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, entity)
);

CREATE OR REPLACE FUNCTION next_doc_no(p_company UUID, p_entity TEXT, p_prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO sequence_counters(company_id, entity, last_no)
  VALUES (p_company, p_entity, 1)
  ON CONFLICT (company_id, entity) DO UPDATE
    SET last_no = sequence_counters.last_no + 1
  RETURNING last_no INTO v_next;
  RETURN p_prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
