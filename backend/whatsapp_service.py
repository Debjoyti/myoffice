import uuid
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from supabase._async.client import AsyncClient, create_client as create_async_client
from supabase.lib.client_options import ClientOptions

class WhatsAppService:
    def __init__(self, db=None, token: str = None):
        self.db = db
        self.token = token
        self.supabase_url = os.environ.get("SUPABASE_URL", "http://localhost:8000")
        self.supabase_key = os.environ.get("SUPABASE_ANON_KEY", "dummy_anon_key")
        self.supabase: AsyncClient = None

    async def initialize(self):
        # We must initialize async client properly and inject token if provided
        options = ClientOptions()
        if self.token:
            options.headers["Authorization"] = f"Bearer {self.token}"

        self.supabase = await create_async_client(self.supabase_url, self.supabase_key, options=options)

    async def check_opt_in(self, company_id: str, phone: str) -> bool:
        """Check if the user has opted in for the company."""
        if not self.supabase:
            await self.initialize()
        try:
            response = await self.supabase.table("wa_consents").select("*").eq("company_id", company_id).eq("phone", phone).execute()
            return len(response.data) > 0
        except Exception as e:
            logging.error(f"Error checking opt-in: {e}")
            return False

    async def log_opt_in(self, company_id: str, phone: str, ip: str, consent_text: str):
        """Log user consent."""
        if not self.supabase:
            await self.initialize()
        now = datetime.now(timezone.utc).isoformat()
        try:
            # Check if exists
            existing = await self.supabase.table("wa_consents").select("*").eq("company_id", company_id).eq("phone", phone).execute()
            if existing.data:
                await self.supabase.table("wa_consents").update({"ip": ip, "consent_text": consent_text, "opted_in_at": now}).eq("company_id", company_id).eq("phone", phone).execute()
            else:
                await self.supabase.table("wa_consents").insert({"company_id": company_id, "phone": phone, "ip": ip, "consent_text": consent_text, "opted_in_at": now}).execute()
        except Exception as e:
            logging.error(f"Error logging opt-in: {e}")

    async def send_message(self, company_id: str, phone: str, template_name: str, variables: list, client_message_id: str = None) -> dict:
        """Send a WhatsApp message using a template (idempotent)."""
        # Ensure opt-in
        has_opted_in = await self.check_opt_in(company_id, phone)
        if not has_opted_in:
            raise Exception("User has not opted in to receive WhatsApp messages.")

        if not self.supabase:
            await self.initialize()

        if client_message_id:
            # Check idempotency
            existing_msg = await self.supabase.table("wa_messages").select("*").eq("client_message_id", client_message_id).execute()
            if existing_msg.data:
                return {"status": "already_queued", "message_id": existing_msg.data[0]["id"]}

        # Lookup template
        template_res = await self.supabase.table("wa_templates").select("*").eq("name", template_name).execute()
        if not template_res.data:
            raise Exception(f"Template '{template_name}' not found.")
        template = template_res.data[0]

        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # In a real integration, we'd call Meta API here.

        message_doc = {
            "id": msg_id,
            "company_id": company_id,
            "direction": "out",
            "phone": phone,
            "template_id": template.get("id"),
            "body": f"Template: {template_name}, Vars: {variables}",
            "status": "queued",
            "client_message_id": client_message_id,
            "created_at": now
        }
        await self.supabase.table("wa_messages").insert(message_doc).execute()

        # Update conversation window
        await self.update_conversation(phone, company_id=company_id, outbound=True)

        return {"status": "queued", "message_id": msg_id}

    async def update_conversation(self, phone: str, company_id: str = None, inbound: bool = False, outbound: bool = False):
        """Update the conversation timestamps."""
        if not self.supabase:
            await self.initialize()
        update_data = {}
        now = datetime.now(timezone.utc)
        if inbound:
            update_data["last_inbound_at"] = now.isoformat()
            update_data["window_expires_at"] = (now + timedelta(hours=24)).isoformat()
        if outbound:
            update_data["last_outbound_at"] = now.isoformat()

        try:
            existing = await self.supabase.table("wa_conversations").select("*").eq("phone", phone).execute()
            if existing.data:
                await self.supabase.table("wa_conversations").update(update_data).eq("phone", phone).execute()
            else:
                doc = {
                    "id": str(uuid.uuid4()),
                    "phone": phone,
                    "created_at": now.isoformat(),
                    **update_data
                }
                if company_id:
                    doc["company_id"] = company_id
                await self.supabase.table("wa_conversations").insert(doc).execute()
        except Exception as e:
            logging.error(f"Error updating conversation: {e}")

    async def process_webhook_receipt(self, message_id: str, status: str):
        """Process delivery receipts."""
        if not self.supabase:
            await self.initialize()
        try:
            await self.supabase.table("wa_messages").update({"status": status}).eq("meta_message_id", message_id).execute()
        except Exception as e:
            logging.error(f"Error processing webhook receipt: {e}")
