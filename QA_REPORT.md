# QA Automation Engineer Bug Report

## Overview
This report contains the findings of edge-case and negative testing across the HRMS, Procurement, and Finance modules. The tests evaluated data consistency, validation rules, and business logic execution.

## Critical Bugs Found

### 1. Procurement & Inventory Module (PR -> PO -> GRN)
- **Missing GRN Functionality:** There are no API endpoints to process a Good Receipt Note (GRN) (`POST /grn` or `POST /inventory/receive`). This breaks the 3-way matching process in procurement, as goods cannot be officially received against a Purchase Order.
- **PO Negative Quantities:** `POST /purchase-orders` accepts negative `quantity` and negative `total_amount` values, which corrupts accounting and inventory if processed.
- **Invalid Vendor Reference in PO:** A PO can be successfully created with a `vendor_id` that does not exist in the database, breaking foreign key integrity.

### 2. Finance Module (Invoices & Payments)
- **Payment Amount Validation:** `POST /payments` accepts negative amounts.
- **Unverified Invoice ID in Payments:** A payment can be created referencing a non-existent `invoice_id`, leading to orphaned payment records.
- **Company Creation Internal Server Error:** `POST /companies` returns a `500 Internal Server Error` when creating a company because the Pydantic schema `CompanyProfileCreate` strictly requires `company_code`, but the endpoint handler automatically generates it. This causes Pydantic to fail validation before the handler runs.

### 3. HRMS Module
- **Department Duplication:** `POST /departments` allows creating multiple departments with the exact same name within the same company.
- **Missing Relationships Validation:** The system allows `POST /employees` even when the specified `department` or `designation` does not exist in the database.
- **Payroll Execution Logic:** `POST /payroll/run` fails with a 400 when an invalid month format is passed, but the error message is not descriptive enough and doesn't explicitly enforce the `YYYY-MM` format.
- **Empty String Inputs:** Endpoints like `POST /departments` allow saving empty strings for required fields like `name` (`""`), creating malformed records.

### 4. General Authentication
- **Duplicate Registration Leak:** While registering an existing email correctly returns a 400 "Email already registered", the system lacks context handling to specify which organization the email belongs to in a multi-tenant environment.

## Fix Recommendations

1. **Schema Validation:** Implement strict Pydantic validation:
   - Add `Field(gt=0)` constraints for quantities, amounts, and prices in PO, PR, and Payment schemas.
   - Add `Field(min_length=1)` to textual fields like department and employee names to prevent empty string submissions.
   - Update `CompanyProfileCreate` to make `company_code: Optional[str] = None`.
2. **Referential Integrity Checks:** Add programmatic lookups before insertions to verify that `vendor_id`, `invoice_id`, `department_id`, and `position_id` actually exist in the database.
3. **API Expansion:** Implement `/grn` endpoints to track received inventory against Purchase Orders and trigger automated GL entries.
4. **Unique Constraints:** Enforce uniqueness checks on `(company_id, name)` for departments.

## Test Coverage Report

- **Flows Tested**: HR -> Payroll, PR -> PO -> GRN -> Payment.
- **Coverage Status**:
  - Validated HRMS onboarding flow from Department/Position creation through Employee onboarding and Payroll execution.
  - Tested PR -> PO workflow; discovered the missing GRN workflow gap.
  - Tested Invoice and Payment matching workflow.
- **Edge Cases Tested**: Missing fields, negative numerical values, empty strings, invalid foreign key references.
