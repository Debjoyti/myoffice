import re

with open("backend/main.py", "r") as f:
    content = f.read()

# I apparently overwrote the model patch somehow or it didn't save before the routes patch
payment_models = """class GoodsReceiptCreate(BaseModel):
    purchase_order_id: str
    store_id: str
    items_received: List[dict]
    receipt_date: str
    delivery_note: Optional[str] = None
    received_by: str

class GoodsReceipt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    purchase_order_id: str
    store_id: str
    items_received: List[dict]
    receipt_date: str
    delivery_note: Optional[str] = None
    received_by: str
    status: str = "completed"
    organization_id: str
    created_at: str

class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_method: str
    payment_date: str
    reference_number: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_id: str
    amount: float
    payment_method: str
    payment_date: str
    reference_number: Optional[str] = None
    status: str = "completed"
    organization_id: str
    created_at: str

"""

invoice_model_search = """class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_number: str
    customer_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_order_id: Optional[str] = None
    goods_receipt_id: Optional[str] = None
    type: str = "AR"
    deal_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    amount_paid: float = 0.0
    status: str = "draft" # draft, pending, partially_paid, paid
    due_date: str
    organization_id: str
    created_at: str"""

old_invoice_search = """class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_number: str
    customer_id: str
    deal_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    status: str = "draft"
    due_date: str
    organization_id: str
    created_at: str"""

if invoice_model_search in content:
    content = content.replace(invoice_model_search, payment_models + invoice_model_search)
elif old_invoice_search in content:
    content = content.replace(old_invoice_search, payment_models + invoice_model_search)
else:
    print("Could not find invoice model to inject models")

with open("backend/main.py", "w") as f:
    f.write(content)

print("Patch complete")
