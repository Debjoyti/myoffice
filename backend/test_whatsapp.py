import pytest
import asyncio
import os
from unittest.mock import MagicMock, patch, AsyncMock
from whatsapp_service import WhatsAppService
from whatsapp_classifier import WhatsAppClassifier

@pytest.fixture
def mock_supabase():
    with patch("whatsapp_service.create_async_client") as mock_create:
        mock_client = MagicMock()
        mock_create.return_value = mock_client
        yield mock_client

@pytest.fixture
def service(mock_supabase):
    os.environ["SUPABASE_URL"] = "http://test"
    os.environ["SUPABASE_ANON_KEY"] = "test"
    return WhatsAppService(db=None, token="test_token")

@pytest.fixture
def classifier():
    return WhatsAppClassifier()

@pytest.mark.asyncio
async def test_opt_in(service, mock_supabase):
    # Mocking check_opt_in behavior for insert
    # Make execute() an AsyncMock since the client methods will return something we must await
    mock_execute = AsyncMock()
    mock_execute.return_value.data = []

    # We need to chain the mocks carefully: table().select().eq().eq().execute()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = mock_execute

    mock_insert_execute = AsyncMock()
    mock_supabase.table.return_value.insert.return_value.execute = mock_insert_execute

    await service.log_opt_in("comp_123", "+1234567890", "127.0.0.1", "I agree")

    # Verify insert was called
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_send_message_idempotent(service, mock_supabase):
    # Mock opt-in
    mock_optin_execute = AsyncMock()
    mock_optin_execute.return_value.data = [{"id": "1"}]
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = mock_optin_execute

    # Mock existing message (idempotency check)
    mock_msg_execute = AsyncMock()
    mock_msg_execute.return_value.data = [{"id": "msg_123"}]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute = mock_msg_execute

    res = await service.send_message("comp_123", "+1234567890", "daily_founder_digest", [], client_message_id="cli_msg_1")
    assert res["status"] == "already_queued"
    assert res["message_id"] == "msg_123"

def test_classifier_approve(classifier):
    res = classifier.classify_intent("Yes, looks good")
    assert res["action"] == "approve"
    assert res["confidence"] >= 0.85

def test_classifier_unknown(classifier):
    res = classifier.classify_intent("What is the meaning of life?")
    assert res["action"] == "unknown"
    assert res["confidence"] < 0.85
