-- ==========================================
-- UP MIGRATION
-- Harden Row-Level Security for multi-tenant isolation
-- ==========================================

-- Companies Table (Using `id`)
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = (auth.jwt() ->> 'company_id')::uuid);

-- For other tables, we redefine SELECT, UPDATE, INSERT to use `company_id` constraint instead of `true`.
-- Dropping old policies
DROP POLICY IF EXISTS "Users can view departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Users can update departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Users can insert departments in their company" ON public.departments;

DROP POLICY IF EXISTS "Users can view positions in their company" ON public.positions;
DROP POLICY IF EXISTS "Users can update positions in their company" ON public.positions;
DROP POLICY IF EXISTS "Users can insert positions in their company" ON public.positions;

DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees in their company" ON public.employees;

DROP POLICY IF EXISTS "Users can view employee positions in their company" ON public.employee_positions;
DROP POLICY IF EXISTS "Users can update employee positions in their company" ON public.employee_positions;
DROP POLICY IF EXISTS "Users can insert employee positions in their company" ON public.employee_positions;

DROP POLICY IF EXISTS "Users can view salary components in their company" ON public.salary_components;
DROP POLICY IF EXISTS "Users can update salary components in their company" ON public.salary_components;
DROP POLICY IF EXISTS "Users can insert salary components in their company" ON public.salary_components;

DROP POLICY IF EXISTS "Users can view salary structures in their company" ON public.salary_structures;
DROP POLICY IF EXISTS "Users can update salary structures in their company" ON public.salary_structures;
DROP POLICY IF EXISTS "Users can insert salary structures in their company" ON public.salary_structures;

DROP POLICY IF EXISTS "Users can view payrolls in their company" ON public.payrolls;
DROP POLICY IF EXISTS "Users can update payrolls in their company" ON public.payrolls;
DROP POLICY IF EXISTS "Users can insert payrolls in their company" ON public.payrolls;

DROP POLICY IF EXISTS "Users can view payslips in their company" ON public.payslips;
DROP POLICY IF EXISTS "Users can update payslips in their company" ON public.payslips;
DROP POLICY IF EXISTS "Users can insert payslips in their company" ON public.payslips;

DROP POLICY IF EXISTS "Users can view compliance records in their company" ON public.compliance_records;
DROP POLICY IF EXISTS "Users can update compliance records in their company" ON public.compliance_records;
DROP POLICY IF EXISTS "Users can insert compliance records in their company" ON public.compliance_records;

DROP POLICY IF EXISTS "Users can view accounts in their company" ON public.accounts;
DROP POLICY IF EXISTS "Users can update accounts in their company" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert accounts in their company" ON public.accounts;

DROP POLICY IF EXISTS "Users can view journal entries in their company" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update journal entries in their company" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert journal entries in their company" ON public.journal_entries;

DROP POLICY IF EXISTS "Users can view journal lines in their company" ON public.journal_lines;
DROP POLICY IF EXISTS "Users can update journal lines in their company" ON public.journal_lines;
DROP POLICY IF EXISTS "Users can insert journal lines in their company" ON public.journal_lines;

DROP POLICY IF EXISTS "Users can view invoices in their company" ON public.invoices;
DROP POLICY IF EXISTS "Users can update invoices in their company" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices in their company" ON public.invoices;

DROP POLICY IF EXISTS "Users can view payments in their company" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments in their company" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments in their company" ON public.payments;

DROP POLICY IF EXISTS "Users can view vendors in their company" ON public.vendors;
DROP POLICY IF EXISTS "Users can update vendors in their company" ON public.vendors;
DROP POLICY IF EXISTS "Users can insert vendors in their company" ON public.vendors;

DROP POLICY IF EXISTS "Users can view items in their company" ON public.items;
DROP POLICY IF EXISTS "Users can update items in their company" ON public.items;
DROP POLICY IF EXISTS "Users can insert items in their company" ON public.items;

DROP POLICY IF EXISTS "Users can view warehouses in their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can update warehouses in their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can insert warehouses in their company" ON public.warehouses;

DROP POLICY IF EXISTS "Users can view stock in their company" ON public.stock;
DROP POLICY IF EXISTS "Users can update stock in their company" ON public.stock;
DROP POLICY IF EXISTS "Users can insert stock in their company" ON public.stock;

DROP POLICY IF EXISTS "Users can view purchase requisitions in their company" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Users can update purchase requisitions in their company" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Users can insert purchase requisitions in their company" ON public.purchase_requisitions;

DROP POLICY IF EXISTS "Users can view PR lines in their company" ON public.pr_lines;
DROP POLICY IF EXISTS "Users can update PR lines in their company" ON public.pr_lines;
DROP POLICY IF EXISTS "Users can insert PR lines in their company" ON public.pr_lines;

DROP POLICY IF EXISTS "Users can view purchase orders in their company" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can update purchase orders in their company" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can insert purchase orders in their company" ON public.purchase_orders;

DROP POLICY IF EXISTS "Users can view PO lines in their company" ON public.po_lines;
DROP POLICY IF EXISTS "Users can update PO lines in their company" ON public.po_lines;
DROP POLICY IF EXISTS "Users can insert PO lines in their company" ON public.po_lines;

DROP POLICY IF EXISTS "Users can view goods receipts in their company" ON public.goods_receipts;
DROP POLICY IF EXISTS "Users can update goods receipts in their company" ON public.goods_receipts;
DROP POLICY IF EXISTS "Users can insert goods receipts in their company" ON public.goods_receipts;

DROP POLICY IF EXISTS "Users can view GRN lines in their company" ON public.grn_lines;
DROP POLICY IF EXISTS "Users can update GRN lines in their company" ON public.grn_lines;
DROP POLICY IF EXISTS "Users can insert GRN lines in their company" ON public.grn_lines;

DROP POLICY IF EXISTS "Users can view assets in their company" ON public.assets;
DROP POLICY IF EXISTS "Users can update assets in their company" ON public.assets;
DROP POLICY IF EXISTS "Users can insert assets in their company" ON public.assets;

DROP POLICY IF EXISTS "Users can view depreciation records in their company" ON public.depreciation_records;
DROP POLICY IF EXISTS "Users can update depreciation records in their company" ON public.depreciation_records;
DROP POLICY IF EXISTS "Users can insert depreciation records in their company" ON public.depreciation_records;

DROP POLICY IF EXISTS "Users can view approval workflows in their company" ON public.approval_workflows;
DROP POLICY IF EXISTS "Users can update approval workflows in their company" ON public.approval_workflows;
DROP POLICY IF EXISTS "Users can insert approval workflows in their company" ON public.approval_workflows;

DROP POLICY IF EXISTS "Users can view audit logs in their company" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update audit logs in their company" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs in their company" ON public.audit_logs;

-- Recreating Policies with proper company_id tenant isolation
CREATE POLICY "Users can view departments in their company" ON public.departments FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update departments in their company" ON public.departments FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert departments in their company" ON public.departments FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view positions in their company" ON public.positions FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update positions in their company" ON public.positions FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert positions in their company" ON public.positions FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view employees in their company" ON public.employees FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update employees in their company" ON public.employees FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert employees in their company" ON public.employees FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view employee positions in their company" ON public.employee_positions FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update employee positions in their company" ON public.employee_positions FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert employee positions in their company" ON public.employee_positions FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view salary components in their company" ON public.salary_components FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update salary components in their company" ON public.salary_components FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert salary components in their company" ON public.salary_components FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view salary structures in their company" ON public.salary_structures FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update salary structures in their company" ON public.salary_structures FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert salary structures in their company" ON public.salary_structures FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view payrolls in their company" ON public.payrolls FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update payrolls in their company" ON public.payrolls FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert payrolls in their company" ON public.payrolls FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view payslips in their company" ON public.payslips FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update payslips in their company" ON public.payslips FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert payslips in their company" ON public.payslips FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view compliance records in their company" ON public.compliance_records FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update compliance records in their company" ON public.compliance_records FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert compliance records in their company" ON public.compliance_records FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view accounts in their company" ON public.accounts FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update accounts in their company" ON public.accounts FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert accounts in their company" ON public.accounts FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view journal entries in their company" ON public.journal_entries FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update journal entries in their company" ON public.journal_entries FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert journal entries in their company" ON public.journal_entries FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view journal lines in their company" ON public.journal_lines FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update journal lines in their company" ON public.journal_lines FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert journal lines in their company" ON public.journal_lines FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view invoices in their company" ON public.invoices FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update invoices in their company" ON public.invoices FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert invoices in their company" ON public.invoices FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view payments in their company" ON public.payments FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update payments in their company" ON public.payments FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert payments in their company" ON public.payments FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view vendors in their company" ON public.vendors FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update vendors in their company" ON public.vendors FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert vendors in their company" ON public.vendors FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view items in their company" ON public.items FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update items in their company" ON public.items FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert items in their company" ON public.items FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view warehouses in their company" ON public.warehouses FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update warehouses in their company" ON public.warehouses FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert warehouses in their company" ON public.warehouses FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view stock in their company" ON public.stock FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update stock in their company" ON public.stock FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert stock in their company" ON public.stock FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view purchase requisitions in their company" ON public.purchase_requisitions FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update purchase requisitions in their company" ON public.purchase_requisitions FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert purchase requisitions in their company" ON public.purchase_requisitions FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view PR lines in their company" ON public.pr_lines FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update PR lines in their company" ON public.pr_lines FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert PR lines in their company" ON public.pr_lines FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view purchase orders in their company" ON public.purchase_orders FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update purchase orders in their company" ON public.purchase_orders FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert purchase orders in their company" ON public.purchase_orders FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view PO lines in their company" ON public.po_lines FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update PO lines in their company" ON public.po_lines FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert PO lines in their company" ON public.po_lines FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view goods receipts in their company" ON public.goods_receipts FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update goods receipts in their company" ON public.goods_receipts FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert goods receipts in their company" ON public.goods_receipts FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view GRN lines in their company" ON public.grn_lines FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update GRN lines in their company" ON public.grn_lines FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert GRN lines in their company" ON public.grn_lines FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view assets in their company" ON public.assets FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update assets in their company" ON public.assets FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert assets in their company" ON public.assets FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view depreciation records in their company" ON public.depreciation_records FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update depreciation records in their company" ON public.depreciation_records FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert depreciation records in their company" ON public.depreciation_records FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view approval workflows in their company" ON public.approval_workflows FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update approval workflows in their company" ON public.approval_workflows FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert approval workflows in their company" ON public.approval_workflows FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view audit logs in their company" ON public.audit_logs FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update audit logs in their company" ON public.audit_logs FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert audit logs in their company" ON public.audit_logs FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
