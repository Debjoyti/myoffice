# Architecture Review Report

## 1. Architecture Flaws
* **Split-Brain Data Model:** The system concurrently uses Supabase (PostgreSQL) and a Python FastAPI backend with MongoDB for the same domains. For example, `approval_workflows`, `companies`, and `employees` exist in both Postgres and MongoDB. This leads to massive data redundancy, lack of a single source of truth, and synchronization nightmares.
* **Leaky Abstractions & Distributed Monolith:** There is no clear separation of concerns between the FastAPI backend, Supabase Edge Functions, and Postgres triggers. Business logic is scattered—for example, the `process_grn_confirmation` trigger handles inventory updates directly in the DB, while Edge functions handle event triggers, and FastAPI handles parallel logic.
* **Weak Multi-Tenant Isolation:** The application is intended to be a multi-tenant SaaS, but Row-Level Security (RLS) policies are dangerously permissive (`USING (true)` for all core tables). This means any authenticated user can read/write data for any company.
* **Synchronous Edge Function Workarounds:** While `pg_net` is used to trigger Edge Functions, the Edge Functions themselves (like `track-event`) lack a proper message queue (like RabbitMQ or Kafka) for reliable asynchronous processing, making them vulnerable to transient failures or timeout limits.

## 2. Schema Issues
* **Missing Tables & Unenforced Foreign Keys:** The `invoices` table references `customer_id` but the `customers` table does not exist in the Postgres schema, meaning there is no foreign key constraint.
* **Cross-Tenant Contamination Risks:** Relationships like `departments.manager_id` referencing `employees(id)` or `stock` table's `item_id` and `warehouse_id` do not enforce `company_id` boundaries. A department could potentially have a manager from a completely different company because the foreign keys are not composite `(company_id, entity_id)`.
* **Database Logic Coupling:** The `on_grn_confirmed` trigger directly manages the `stock` table. Embedding complex business logic in database triggers makes version control, testing, and debugging significantly harder and tightly couples the inventory module to PostgreSQL.
* **Redundant Data Stores:** The FastAPI backend relies heavily on `InMemoryDatabase` as a fallback, which means state will be lost on restarts if MongoDB is unavailable, circumventing the Postgres database altogether.

## 3. Suggested Improvements
* **Unify the Data Store:** Choose either PostgreSQL (Supabase) or MongoDB as the primary operational database to eliminate the split-brain issue. Given the relational nature of ERPs, PostgreSQL is the superior choice. Migrate all FastAPI MongoDB calls to use the Supabase Postgres database.
* **Enforce Strict Multi-Tenancy:**
  - Update all RLS policies to check the user's affiliation (e.g., `USING (company_id = get_user_company_id())`).
  - Use composite primary/foreign keys (e.g., `PRIMARY KEY (company_id, id)`) to enforce hard tenant boundaries at the schema level and prevent cross-tenant data leakage.
* **Decouple Business Logic:** Remove business logic from database triggers (like `process_grn_confirmation`). Move this logic to the application layer (FastAPI or a dedicated microservice) where it can be tested and scaled independently.
* **Implement a Message Queue:** Replace direct HTTP webhook calls to Edge Functions with a robust message broker (e.g., Redis, RabbitMQ, or AWS SQS) for reliable asynchronous event processing, retries, and dead-letter queues.
* **Modularize the Monolith:** Define clear boundaries for HRMS, Finance, and Procurement. Ensure modules communicate via well-defined APIs or events rather than sharing database tables directly.

## 4. Final Architecture Score
**Score: 4/10**
*The system has a foundational schema but suffers from critical architectural anti-patterns, specifically the split-brain database issue and non-existent multi-tenant data isolation. Significant refactoring is required to make it production-ready and scalable.*
