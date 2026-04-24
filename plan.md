1. **Script to Patch Database Models (backend/main.py):**
   - Write a python script to add the missing Pydantic models to `backend/main.py`: `GoodsReceipt`, `GoodsReceiptCreate`, `Payment`, `PaymentCreate`.
   - Enhance existing `PurchaseRequest`, `PurchaseOrder`, `Invoice` to include multi-level workflow states, linked IDs, etc.
   - Expand `Asset` lifecycle fields.

2. **Verify Database Models Patch:**
   - Run `python -m py_compile backend/main.py` and inspect `backend/main.py` to ensure the models were added correctly.

3. **Script to Patch Backend API Routes (backend/main.py):**
   - Write a python script to append/modify endpoints in `backend/main.py`:
     - Add `POST /api/goods-receipts` to create a GRN and incrementally update `InventoryItem`.
     - Add `GET /api/goods-receipts`.
     - Modify `POST /api/invoices` to ensure 3-way matching and status updates.
     - Add `POST /api/payments` and `GET /api/payments`.
     - Add JournalEntry auto-creation logic in GRN, Invoice, and Payment flows.
     - Modify `PATCH /api/purchase-orders/{po_id}/status` to remove auto-delivery logic.

4. **Verify Backend Endpoints:**
   - Start the backend server locally using `uvicorn main:app --host 127.0.0.1 --port 8000` to verify it boots successfully without errors.

5. **Patch GoodsReceipts UI:**
   - Create a python script to create `frontend/src/pages/GoodsReceipts.js`.

6. **Patch PurchaseOrders UI:**
   - Create a python script to modify `frontend/src/pages/PurchaseOrders.js` to add GRN linking.

7. **Patch Finance UI:**
   - Create a python script to modify `frontend/src/pages/Finance.js` to handle AP Invoices, 3-way matching, and Payments.

8. **Patch AssetManagement UI:**
   - Create a python script to modify `frontend/src/pages/AssetManagement.js` to display the full lifecycle.

9. **Verify Frontend UI:**
   - Run `cd frontend && npm run build` to confirm no build errors.

10. **Test End-to-End Flow:**
    - Create and run an automated test script (`backend_test.py` or new test) to perform the full PR -> PO -> GRN -> Invoice -> Payment -> GL Entry flow against the locally running server.

11. **Pre-commit Steps:**
    - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

12. **Submit Change:**
    - Once all tests pass, submit the change.
