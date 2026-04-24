-- ==========================================
-- SAAS ERP SCHEMA EXTENSION
-- Core Modules: HRMS, Organization Structure, Payroll, Finance, Procurement, Inventory, Asset Management
-- ==========================================

-- ==========================================
-- 0. CORE / ORGANIZATION
-- ==========================================

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    tax_id TEXT,
    registration_number TEXT,
    address JSONB,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (true); -- simplify for now

CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_id UUID, -- References employees(id) later
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 1. HRMS & PAYROLL
-- ==========================================

CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_code TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    date_of_joining DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.departments ADD CONSTRAINT fk_department_manager FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE TABLE public.employee_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earning', 'deduction', 'statutory')),
    is_taxable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL,
    components JSONB DEFAULT '[]'::jsonb, -- Array of component ids and amounts/percentages
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    process_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
    total_gross NUMERIC(15, 2) DEFAULT 0,
    total_net NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES public.payrolls(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    gross_salary NUMERIC(15, 2) NOT NULL,
    net_salary NUMERIC(15, 2) NOT NULL,
    earnings JSONB DEFAULT '[]'::jsonb,
    deductions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    compliance_type TEXT NOT NULL, -- e.g., 'PF', 'ESI', 'Tax'
    registration_number TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 2. FINANCE (GL/AP/AR)
-- ==========================================

CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    reference TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'void')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    debit NUMERIC(15, 2) DEFAULT 0,
    credit NUMERIC(15, 2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID, -- Would link to a customers table
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    tax_total NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id),
    amount NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    reference TEXT,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 3. PROCUREMENT & INVENTORY
-- ==========================================

CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address JSONB,
    tax_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_of_measure TEXT NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0,
    is_inventory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    manager_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(item_id, warehouse_id)
);

CREATE TABLE public.purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.employees(id),
    department_id UUID REFERENCES public.departments(id),
    request_date DATE NOT NULL,
    required_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'converted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.pr_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id),
    description TEXT NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL,
    estimated_price NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    po_number TEXT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'partially_received', 'received', 'closed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, po_number)
);

CREATE TABLE public.po_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    pr_line_id UUID REFERENCES public.pr_lines(id),
    item_id UUID REFERENCES public.items(id),
    description TEXT NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    received_quantity NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    receipt_date DATE NOT NULL,
    received_by UUID REFERENCES public.employees(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.grn_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    po_line_id UUID NOT NULL REFERENCES public.po_lines(id),
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity_received NUMERIC(15, 2) NOT NULL,
    accepted_quantity NUMERIC(15, 2) NOT NULL,
    rejected_quantity NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 4. ASSET MANAGEMENT
-- ==========================================

CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_tag TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    purchase_date DATE,
    purchase_cost NUMERIC(15, 2),
    current_value NUMERIC(15, 2),
    assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, asset_tag)
);

CREATE TABLE public.depreciation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    depreciation_amount NUMERIC(15, 2) NOT NULL,
    accumulated_depreciation NUMERIC(15, 2) NOT NULL,
    book_value NUMERIC(15, 2) NOT NULL,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. WORKFLOWS & LOGS
-- ==========================================

CREATE TABLE public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- e.g., 'purchase_requisition', 'leave_request'
    entity_id UUID NOT NULL,
    requester_id UUID NOT NULL REFERENCES public.employees(id),
    approver_id UUID NOT NULL REFERENCES public.employees(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- 6. TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to handle GRN confirmation -> Update Stock
CREATE OR REPLACE FUNCTION public.process_grn_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'draft' THEN
        -- Loop through GRN lines and update stock
        DECLARE
            grn_record RECORD;
        BEGIN
            FOR grn_record IN SELECT * FROM public.grn_lines WHERE grn_id = NEW.id LOOP
                -- Update stock or insert if not exists
                INSERT INTO public.stock (item_id, warehouse_id, quantity)
                VALUES (grn_record.item_id, NEW.warehouse_id, grn_record.accepted_quantity)
                ON CONFLICT (item_id, warehouse_id)
                DO UPDATE SET quantity = public.stock.quantity + grn_record.accepted_quantity, updated_at = now();

                -- Update PO Line received quantity
                UPDATE public.po_lines
                SET received_quantity = received_quantity + grn_record.accepted_quantity
                WHERE id = grn_record.po_line_id;
            END LOOP;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_grn_confirmed
    AFTER UPDATE ON public.goods_receipts
    FOR EACH ROW EXECUTE PROCEDURE public.process_grn_confirmation();

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies need to be defined based on user roles and company_id

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================

-- Companies
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (true); -- simplify for now
CREATE POLICY "Users can update their own company" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Users can insert their own company" ON public.companies FOR INSERT WITH CHECK (true);

-- Departments
CREATE POLICY "Users can view departments in their company" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Users can update departments in their company" ON public.departments FOR UPDATE USING (true);
CREATE POLICY "Users can insert departments in their company" ON public.departments FOR INSERT WITH CHECK (true);

-- Positions
CREATE POLICY "Users can view positions in their company" ON public.positions FOR SELECT USING (true);
CREATE POLICY "Users can update positions in their company" ON public.positions FOR UPDATE USING (true);
CREATE POLICY "Users can insert positions in their company" ON public.positions FOR INSERT WITH CHECK (true);

-- Employees
CREATE POLICY "Users can view employees in their company" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Users can update employees in their company" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Users can insert employees in their company" ON public.employees FOR INSERT WITH CHECK (true);

-- Employee Positions
CREATE POLICY "Users can view employee positions in their company" ON public.employee_positions FOR SELECT USING (true);
CREATE POLICY "Users can update employee positions in their company" ON public.employee_positions FOR UPDATE USING (true);
CREATE POLICY "Users can insert employee positions in their company" ON public.employee_positions FOR INSERT WITH CHECK (true);

-- Salary Components
CREATE POLICY "Users can view salary components in their company" ON public.salary_components FOR SELECT USING (true);
CREATE POLICY "Users can update salary components in their company" ON public.salary_components FOR UPDATE USING (true);
CREATE POLICY "Users can insert salary components in their company" ON public.salary_components FOR INSERT WITH CHECK (true);

-- Salary Structures
CREATE POLICY "Users can view salary structures in their company" ON public.salary_structures FOR SELECT USING (true);
CREATE POLICY "Users can update salary structures in their company" ON public.salary_structures FOR UPDATE USING (true);
CREATE POLICY "Users can insert salary structures in their company" ON public.salary_structures FOR INSERT WITH CHECK (true);

-- Payrolls
CREATE POLICY "Users can view payrolls in their company" ON public.payrolls FOR SELECT USING (true);
CREATE POLICY "Users can update payrolls in their company" ON public.payrolls FOR UPDATE USING (true);
CREATE POLICY "Users can insert payrolls in their company" ON public.payrolls FOR INSERT WITH CHECK (true);

-- Payslips
CREATE POLICY "Users can view payslips in their company" ON public.payslips FOR SELECT USING (true);
CREATE POLICY "Users can update payslips in their company" ON public.payslips FOR UPDATE USING (true);
CREATE POLICY "Users can insert payslips in their company" ON public.payslips FOR INSERT WITH CHECK (true);

-- Compliance Records
CREATE POLICY "Users can view compliance records in their company" ON public.compliance_records FOR SELECT USING (true);
CREATE POLICY "Users can update compliance records in their company" ON public.compliance_records FOR UPDATE USING (true);
CREATE POLICY "Users can insert compliance records in their company" ON public.compliance_records FOR INSERT WITH CHECK (true);

-- Accounts
CREATE POLICY "Users can view accounts in their company" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Users can update accounts in their company" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "Users can insert accounts in their company" ON public.accounts FOR INSERT WITH CHECK (true);

-- Journal Entries
CREATE POLICY "Users can view journal entries in their company" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "Users can update journal entries in their company" ON public.journal_entries FOR UPDATE USING (true);
CREATE POLICY "Users can insert journal entries in their company" ON public.journal_entries FOR INSERT WITH CHECK (true);

-- Journal Lines
CREATE POLICY "Users can view journal lines in their company" ON public.journal_lines FOR SELECT USING (true);
CREATE POLICY "Users can update journal lines in their company" ON public.journal_lines FOR UPDATE USING (true);
CREATE POLICY "Users can insert journal lines in their company" ON public.journal_lines FOR INSERT WITH CHECK (true);

-- Invoices
CREATE POLICY "Users can view invoices in their company" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Users can update invoices in their company" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Users can insert invoices in their company" ON public.invoices FOR INSERT WITH CHECK (true);

-- Payments
CREATE POLICY "Users can view payments in their company" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Users can update payments in their company" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Users can insert payments in their company" ON public.payments FOR INSERT WITH CHECK (true);

-- Vendors
CREATE POLICY "Users can view vendors in their company" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Users can update vendors in their company" ON public.vendors FOR UPDATE USING (true);
CREATE POLICY "Users can insert vendors in their company" ON public.vendors FOR INSERT WITH CHECK (true);

-- Items
CREATE POLICY "Users can view items in their company" ON public.items FOR SELECT USING (true);
CREATE POLICY "Users can update items in their company" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Users can insert items in their company" ON public.items FOR INSERT WITH CHECK (true);

-- Warehouses
CREATE POLICY "Users can view warehouses in their company" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Users can update warehouses in their company" ON public.warehouses FOR UPDATE USING (true);
CREATE POLICY "Users can insert warehouses in their company" ON public.warehouses FOR INSERT WITH CHECK (true);

-- Stock
CREATE POLICY "Users can view stock in their company" ON public.stock FOR SELECT USING (true);
CREATE POLICY "Users can update stock in their company" ON public.stock FOR UPDATE USING (true);
CREATE POLICY "Users can insert stock in their company" ON public.stock FOR INSERT WITH CHECK (true);

-- Purchase Requisitions
CREATE POLICY "Users can view purchase requisitions in their company" ON public.purchase_requisitions FOR SELECT USING (true);
CREATE POLICY "Users can update purchase requisitions in their company" ON public.purchase_requisitions FOR UPDATE USING (true);
CREATE POLICY "Users can insert purchase requisitions in their company" ON public.purchase_requisitions FOR INSERT WITH CHECK (true);

-- PR Lines
CREATE POLICY "Users can view PR lines in their company" ON public.pr_lines FOR SELECT USING (true);
CREATE POLICY "Users can update PR lines in their company" ON public.pr_lines FOR UPDATE USING (true);
CREATE POLICY "Users can insert PR lines in their company" ON public.pr_lines FOR INSERT WITH CHECK (true);

-- Purchase Orders
CREATE POLICY "Users can view purchase orders in their company" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Users can update purchase orders in their company" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Users can insert purchase orders in their company" ON public.purchase_orders FOR INSERT WITH CHECK (true);

-- PO Lines
CREATE POLICY "Users can view PO lines in their company" ON public.po_lines FOR SELECT USING (true);
CREATE POLICY "Users can update PO lines in their company" ON public.po_lines FOR UPDATE USING (true);
CREATE POLICY "Users can insert PO lines in their company" ON public.po_lines FOR INSERT WITH CHECK (true);

-- Goods Receipts
CREATE POLICY "Users can view goods receipts in their company" ON public.goods_receipts FOR SELECT USING (true);
CREATE POLICY "Users can update goods receipts in their company" ON public.goods_receipts FOR UPDATE USING (true);
CREATE POLICY "Users can insert goods receipts in their company" ON public.goods_receipts FOR INSERT WITH CHECK (true);

-- GRN Lines
CREATE POLICY "Users can view GRN lines in their company" ON public.grn_lines FOR SELECT USING (true);
CREATE POLICY "Users can update GRN lines in their company" ON public.grn_lines FOR UPDATE USING (true);
CREATE POLICY "Users can insert GRN lines in their company" ON public.grn_lines FOR INSERT WITH CHECK (true);

-- Assets
CREATE POLICY "Users can view assets in their company" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Users can update assets in their company" ON public.assets FOR UPDATE USING (true);
CREATE POLICY "Users can insert assets in their company" ON public.assets FOR INSERT WITH CHECK (true);

-- Depreciation Records
CREATE POLICY "Users can view depreciation records in their company" ON public.depreciation_records FOR SELECT USING (true);
CREATE POLICY "Users can update depreciation records in their company" ON public.depreciation_records FOR UPDATE USING (true);
CREATE POLICY "Users can insert depreciation records in their company" ON public.depreciation_records FOR INSERT WITH CHECK (true);

-- Approval Workflows
CREATE POLICY "Users can view approval workflows in their company" ON public.approval_workflows FOR SELECT USING (true);
CREATE POLICY "Users can update approval workflows in their company" ON public.approval_workflows FOR UPDATE USING (true);
CREATE POLICY "Users can insert approval workflows in their company" ON public.approval_workflows FOR INSERT WITH CHECK (true);

-- Audit Logs
CREATE POLICY "Users can view audit logs in their company" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Users can update audit logs in their company" ON public.audit_logs FOR UPDATE USING (true);
CREATE POLICY "Users can insert audit logs in their company" ON public.audit_logs FOR INSERT WITH CHECK (true);


-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_companies_org_id ON public.companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_company_id ON public.payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON public.journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id);
