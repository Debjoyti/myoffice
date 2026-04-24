import re

with open("backend/main.py", "r") as f:
    content = f.read()

search = """class InvoiceCreate(BaseModel):
    customer_id: str
    deal_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    due_date: str"""

replace = """class InvoiceCreate(BaseModel):
    customer_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_order_id: Optional[str] = None
    goods_receipt_id: Optional[str] = None
    type: str = "AR"
    deal_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    due_date: str"""

if search in content:
    content = content.replace(search, replace)
    with open("backend/main.py", "w") as f:
        f.write(content)
    print("Fixed InvoiceCreate model")
else:
    print("Could not find InvoiceCreate model")
