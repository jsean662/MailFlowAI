from app.services.gmail_service import GmailService
from app.schemas.email import EmailPreview, EmailDetail
from unittest.mock import MagicMock
import base64
import pytest
from datetime import datetime

class TestGmailService:

    @pytest.fixture
    def mock_service_resource(self):
        return MagicMock()

    @pytest.fixture
    def gmail_service(self, mock_service_resource):
        token_data = {
            'access_token': 'test',
            'refresh_token': 'test',
            'client_id': 'test',
            'client_secret': 'test'
        }
        service = GmailService(token_data)
        service.service = mock_service_resource
        return service

    def test_list_inbox_emails_empty(self, gmail_service, mock_service_resource):
        # Mock empty list response
        mock_service_resource.users().messages().list().execute.return_value = {}
        
        result = gmail_service.list_inbox_emails()
        assert result.messages == []
        assert result.nextPageToken is None

    def test_list_inbox_emails_success(self, gmail_service, mock_service_resource):
        # Mock list response
        mock_service_resource.users().messages().list().execute.return_value = {
            'messages': [{'id': '123'}],
            'nextPageToken': 'abc'
        }
        
        # Mock get response for message details
        mock_message = {
            'id': '123',
            'internalDate': '1609459200000', # 2021-01-01
            'snippet': 'Hello world',
            'labelIds': ['UNREAD', 'INBOX'],
            'payload': {
                'headers': [
                    {'name': 'From', 'value': 'sender@example.com'},
                    {'name': 'Subject', 'value': 'Test Subject'}
                ]
            }
        }
        mock_service_resource.users().messages().get().execute.return_value = mock_message
        
        result = gmail_service.list_inbox_emails()
        
        assert len(result.messages) == 1
        assert result.nextPageToken == 'abc'
        email = result.messages[0]
        assert email.id == '123'
        assert email.sender == 'sender@example.com'
        assert email.subject == 'Test Subject'
        assert email.snippet == 'Hello world'
        assert email.date == datetime.fromtimestamp(1609459200)
        assert email.unread is True

    def test_list_inbox_emails_pagination(self, gmail_service, mock_service_resource):
        # Test passing page_token
        mock_service_resource.users().messages().list().execute.return_value = {}
        
        gmail_service.list_inbox_emails(page_token='token123')
        
        # Verify list was called with pageToken
        call_args = mock_service_resource.users().messages().list.call_args[1]
        assert call_args['pageToken'] == 'token123'

    def test_get_email_detail_html(self, gmail_service, mock_service_resource):
        # Mock HTML body
        html_content = "<b>Hello</b>"
        b64_html = base64.urlsafe_b64encode(html_content.encode('utf-8')).decode('utf-8')
        
        mock_message = {
            'id': '123',
            'internalDate': '1609459200000',
            'labelIds': [],
            'payload': {
                'headers': [],
                'parts': [
                    {
                        'mimeType': 'text/html',
                        'body': {'data': b64_html}
                    }
                ]
            }
        }
        mock_service_resource.users().messages().get().execute.return_value = mock_message
        
        detail = gmail_service.get_email_detail('123')
        assert detail.body == html_content

    def test_get_email_detail_plain(self, gmail_service, mock_service_resource):
        # Mock Plain body when HTML is missing
        text_content = "Hello"
        b64_text = base64.urlsafe_b64encode(text_content.encode('utf-8')).decode('utf-8')
        
        mock_message = {
            'id': '123',
            'internalDate': '1609459200000',
            'labelIds': [],
            'payload': {
                'headers': [],
                'parts': [
                    {
                        'mimeType': 'text/plain',
                        'body': {'data': b64_text}
                    }
                ]
            }
        }
        mock_service_resource.users().messages().get().execute.return_value = mock_message
        
        detail = gmail_service.get_email_detail('123')
        assert detail.body == text_content

    def test_send_email(self, gmail_service, mock_service_resource):
        to = ["test@example.com"]
        subject = "Hello"
        body = "World"
        
        gmail_service.send_email(to, subject, body)
        
        # Verify send was called
        mock_service_resource.users().messages().send.assert_called_once()
        call_args = mock_service_resource.users().messages().send.call_args[1]
        assert 'body' in call_args
        assert 'raw' in call_args['body']
        
        # Decode sent message to verify content exists (decoding fully is complex due to MIME but we check raw exists)
        assert call_args['body']['raw']

    def test_search_emails(self, gmail_service, mock_service_resource):
         mock_service_resource.users().messages().list().execute.return_value = {
            'messages': [{'id': '123'}]
        }
         # Reuse mock message setup or mock get simply
         mock_service_resource.users().messages().get().execute.return_value = {
            'id': '123',
            'internalDate': '1609459200000',
            'snippet': 'Search result',
            'labelIds': [],
            'payload': {'headers': []}
        }
         
         results = gmail_service.search_emails("test query")
         assert len(results) == 1
         mock_service_resource.users().messages().list.assert_called_with(userId='me', q="test query")


    def test_list_sent_emails_empty(self, gmail_service, mock_service_resource):
        # Mock empty list response for SENT
        mock_service_resource.users().messages().list().execute.return_value = {}
        
        result = gmail_service.list_sent_emails()
        assert result.messages == []
        assert result.nextPageToken is None
        # Verify labelIds=['SENT'] was used
        call_kwargs = mock_service_resource.users().messages().list.call_args[1]
        assert call_kwargs['labelIds'] == ['SENT']

    def test_list_sent_emails_success(self, gmail_service, mock_service_resource):
        mock_service_resource.users().messages().list().execute.return_value = {
            'messages': [{'id': 'sent1'}]
        }
        
        mock_service_resource.users().messages().get().execute.return_value = {
            'id': 'sent1',
            'internalDate': '1609459200000',
            'snippet': 'Sent msg',
            'labelIds': ['SENT'],
            'payload': {
                'headers': [
                    {'name': 'To', 'value': 'recipient@example.com'},
                    {'name': 'Subject', 'value': 'Sent Subject'}
                ]
            }
        }
        
        result = gmail_service.list_sent_emails()
        assert len(result.messages) == 1
        assert result.messages[0].sender == 'recipient@example.com' # Logic maps 'To' to sender field for preview in sent box
        assert result.messages[0].unread is False # Sent emails are read

    def test_error_handling_in_loops(self, gmail_service, mock_service_resource):
        # List returns 2 messages
        mock_service_resource.users().messages().list().execute.return_value = {
            'messages': [{'id': 'bad'}, {'id': 'good'}]
        }
        
        # We need get() to return a request object, whose execute() method returns the data or raises
        mock_request = MagicMock()
        mock_service_resource.users().messages().get.return_value = mock_request
        
        def execute_side_effect():
            # Inspect the call arguments to get() to decide what to do
            # The get() call happened before creating this request object, 
            # but since we reuse the same mock_request for all get() calls, 
            # we need a way to know WHICH message context we are in.
            
            # Alternative: simpler mocking strategy.
            # Instead of reuse, we can use side_effect on get() to return DIFFERENT mock request objects
            # or configure the same mock_request to change behavior? No, that's hard with loop.
            
            # Best way: get() side_effect returns different mock objects for each call.
            pass

        # Let's redefine the strategy completely for clarity
        
        # Create two mock request objects
        bad_request = MagicMock()
        bad_request.execute.side_effect = Exception("Fetch failed")
        
        good_request = MagicMock()
        good_request.execute.return_value = {
            'id': 'good',
            'internalDate': '1609459200000',
            'snippet': 'Good msg',
            'labelIds': [],
            'payload': {'headers': []}
        }
        
        def get_side_effect(userId, id, format):
            if id == 'bad':
                return bad_request
            return good_request
            
        mock_service_resource.users().messages().get.side_effect = get_side_effect
        
        # Should populate previews with valid messages only, not crash
        result = gmail_service.list_inbox_emails()
        assert len(result.messages) == 1
        assert result.messages[0].id == 'good'

    def test_get_email_detail_direct_body(self, gmail_service, mock_service_resource):
        # Test case where body is directly in payload['body'], not in parts
        content = "Direct body"
        b64_content = base64.urlsafe_b64encode(content.encode('utf-8')).decode('utf-8')
        
        mock_message = {
            'id': 'direct',
            'internalDate': '1609459200000',
            'labelIds': [],
            'payload': {
                'headers': [],
                'body': {
                    'data': b64_content
                }
            }
        }
        mock_service_resource.users().messages().get().execute.return_value = mock_message
        
        detail = gmail_service.get_email_detail('direct')
        assert detail.body == content

    def test_search_emails_empty(self, gmail_service, mock_service_resource):
        mock_service_resource.users().messages().list().execute.return_value = {}
        
        results = gmail_service.search_emails("empty")
        assert results == []
