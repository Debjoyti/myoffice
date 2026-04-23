import sys

def main():
    with open('/app/backend/main.py', 'r') as f:
        content = f.read()

    # The previous patching script failed because I was in the wrong directory or something...

    # Add DELETE purchase-requests
    pr_reject_index = content.find("@api_router.patch(\"/purchase-requests/{pr_id}/reject\")")
    pr_delete_endpoint = """
@api_router.delete("/purchase-requests/{pr_id}")
async def delete_purchase_request(pr_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.purchase_requests.delete_one({"id": pr_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return {"message": "Purchase request deleted"}
"""
    if "@api_router.delete(\"/purchase-requests/{pr_id}\")" not in content:
        content = content[:pr_reject_index] + pr_delete_endpoint.strip() + "\n\n" + content[pr_reject_index:]

    # Add DELETE purchase-orders
    po_status_index = content.find("@api_router.patch(\"/purchase-orders/{po_id}/status\")")
    po_delete_endpoint = """
@api_router.delete("/purchase-orders/{po_id}")
async def delete_purchase_order(po_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.purchase_orders.delete_one({"id": po_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"message": "Purchase order deleted"}
"""
    if "@api_router.delete(\"/purchase-orders/{po_id}\")" not in content:
        content = content[:po_status_index] + po_delete_endpoint.strip() + "\n\n" + content[po_status_index:]

    # Modify PATCH purchase-orders status
    po_status_patch = """@api_router.patch("/purchase-orders/{po_id}/status")
async def update_purchase_order_status(po_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    po = await db.purchase_orders.find_one({"id": po_id})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    result = await db.purchase_orders.update_one({"id": po_id}, {"$set": {"status": status_data.status}})

    if status_data.status == "delivered" and po.get("status") != "delivered":
        store = await db.stores.find_one({"id": po.get("store_id")})
        location_name = store.get("name") if store else "Warehouse"

        org_id = po.get("organization_id", current_user.get("organization_id"))

        # update inventory
        for item in po.get("items", []):
            item_name = item.get("name")
            qty_to_add = int(item.get("quantity", 0))

            existing_item = await db.inventory.find_one({
                "organization_id": org_id,
                "name": item_name,
                "location": location_name
            })

            if existing_item:
                await db.inventory.update_one(
                    {"id": existing_item["id"]},
                    {"$inc": {"quantity": qty_to_add}}
                )
            else:
                new_item = {
                    "id": str(uuid.uuid4()),
                    "organization_id": org_id,
                    "name": item_name,
                    "category": "supplies",
                    "quantity": qty_to_add,
                    "unit": item.get("unit", "pcs"),
                    "price_per_unit": item.get("price", item.get("unit_price", 0)),
                    "location": location_name,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.inventory.insert_one(new_item)

    return {"message": "Purchase order status updated"}"""

    po_status_old = """@api_router.patch("/purchase-orders/{po_id}/status")
async def update_purchase_order_status(po_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.purchase_orders.update_one({"id": po_id}, {"$set": {"status": status_data.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"message": "Purchase order status updated"}"""

    if "if status_data.status == \"delivered\" and po.get(\"status\") != \"delivered\":" not in content:
        content = content.replace(po_status_old, po_status_patch)

    # Add DELETE & PUT inventory
    inventory_stores_index = content.find("@api_router.post(\"/stores\", response_model=Store)")
    inventory_endpoints = """
@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": "Inventory item deleted"}

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, item_data: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    result = await db.inventory.update_one(
        {"id": item_id},
        {"$set": item_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    updated_item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    return updated_item
"""
    if "@api_router.delete(\"/inventory/{item_id}\")" not in content:
        content = content[:inventory_stores_index] + inventory_endpoints.strip() + "\n\n" + content[inventory_stores_index:]

    with open('/app/backend/main.py', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    main()
