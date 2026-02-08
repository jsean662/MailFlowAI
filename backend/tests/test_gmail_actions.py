import pytest
from unittest.mock import MagicMock, patch
from app.services.gmail_service import GmailService
import base64

@pytest.fixture
def mock_gmail_service():
    token_data = {
        'access_token': 'fake_access_token',
        'refresh_token': 'fake_refresh_token',
        'client_id': 'fake_client_id',
        'client_secret': 'fake_client_secret'
    }
    with patch('app.services.gmail_service.Credentials') as MockCredentials, \
         patch('app.services.gmail_service.build') as MockBuild:
        service = GmailService(token_data)
        service.service = MagicMock()
        return service

def test_delete_email(mock_gmail_service):
    message_id = "12345"
    mock_gmail_service.delete_email(message_id)
    
    mock_gmail_service.service.users().messages().trash.assert_called_once_with(
        userId='me', id=message_id
    )

def test_reply_email(mock_gmail_service):
    original_message_id = "12345"
    reply_body = "This is a reply."
    
    # Mock the original email retrieval
    mock_gmail_service.service.users().messages().get.return_value.execute.return_value = {
        "id": original_message_id,
        "threadId": "thread123",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Test Subject"},
                {"name": "From", "value": "sender@example.com <sender@example.com>"},
                {"name": "Message-ID", "value": "<original@example.com>"}
            ]
        }
    }
    
    # Execute reply
    mock_gmail_service.reply_email(original_message_id, reply_body)
    
    # Verify get was called to fetch original details
    mock_gmail_service.service.users().messages().get.assert_called_with(
        userId='me', id=original_message_id, format='metadata'
    )
    
    # Verify send was called
    send_mock = mock_gmail_service.service.users().messages().send
    assert send_mock.called
    kwargs = send_mock.call_args[1]
    assert kwargs['userId'] == 'me'
    assert 'threadId' in kwargs['body']
    assert kwargs['body']['threadId'] == 'thread123'
    
    # Check if raw message contains expected headers
    raw = kwargs['body']['raw']
    decoded_bytes = base64.urlsafe_b64decode(raw)
    from email import message_from_bytes
    msg = message_from_bytes(decoded_bytes)
    
    assert msg['Subject'] == "Re: Test Subject"
    assert "sender@example.com" in msg['To']
    assert msg['In-Reply-To'] == "<original@example.com>"

def test_forward_email(mock_gmail_service):
    original_message_id = "12345"
    forward_to = ["recipient@example.com"]
    forward_body = "Check this out."
    
    # Mock original email detail retrieval
    # We need to mock get_email_detail since forward_email calls it
    # But get_email_detail calls service.get, so let's mock service.get return values
    
    mock_return_val = {
        "id": original_message_id,
        "internalDate": "1600000000000",
        "labelIds": [],
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Original Subject"},
                {"name": "From", "value": "original@sender.com"}
            ],
            "body": {"data": base64.urlsafe_b64encode(b"Original Body").decode('utf-8')}
        },
        "snippet": "Original snippet"
    }

    mock_gmail_service.service.users().messages().get.return_value.execute.return_value = mock_return_val
    
    # Execute forward
    mock_gmail_service.forward_email(original_message_id, forward_to, forward_body)
    
    # Verify send was called
    send_mock = mock_gmail_service.service.users().messages().send
    assert send_mock.called
    
    # Check content
    kwargs = send_mock.call_args[1]
    raw = kwargs['body']['raw']
    decoded_bytes = base64.urlsafe_b64decode(raw)
    from email import message_from_bytes
    msg = message_from_bytes(decoded_bytes)
    
    assert msg['Subject'] == "Fwd: Original Subject"
    assert "recipient@example.com" in msg['To']
    
    payload = msg.get_payload()
    # Payload might be a list if multipart or string if plain
    body_content = payload if isinstance(payload, str) else payload[0].get_payload()
    
    assert "Check this out." in body_content
    assert "---------- Forwarded message ---------" in body_content
    assert "Original Body" in body_content
