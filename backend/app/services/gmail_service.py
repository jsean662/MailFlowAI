from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from email.mime.text import MIMEText
from email.utils import parseaddr
from datetime import datetime
from bs4 import BeautifulSoup
from app.schemas.email import EmailPreview, EmailDetail, PaginatedEmails
from app.schemas.email import PaginatedEmails

class GmailService:
    def __init__(self, token_data):
        """
        Initialize Gmail API client with credentials.
        token_data: Object containing access_token, refresh_token, token_uri, client_id, client_secret
        """
        self.creds = Credentials(
            token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=token_data['client_id'],
            client_secret=token_data['client_secret'],
            scopes=[
                "https://www.googleapis.com/auth/gmail.readonly", 
                "https://www.googleapis.com/auth/gmail.send", 
                "https://www.googleapis.com/auth/gmail.modify"
            ]
        )
        self.service = build("gmail", "v1", credentials=self.creds)


    def _parse_header(self, headers, name):
        """Helper to extract header value by name."""
        for header in headers:
            if header['name'].lower() == name.lower():
                return header['value']
        return ""


    def _parse_timestamp(self, internal_date):
        """Helper to parse Gmail internal date (ms) to datetime."""
        return datetime.fromtimestamp(int(internal_date) / 1000)


    def _get_body(self, payload):
        """
        Recursively extract body from payload parts. 
        Prioritizes HTML, falls back to Plain Text.
        """
        body = ""
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/html':
                    data = part['body'].get('data')
                    if data:
                        body = base64.urlsafe_b64decode(data).decode('utf-8')
                        break # Found HTML, stop looking
                elif part['mimeType'] == 'text/plain':
                     data = part['body'].get('data')
                     if data:
                         body = base64.urlsafe_b64decode(data).decode('utf-8')
        elif 'body' in payload:
             data = payload['body'].get('data')
             if data:
                 body = base64.urlsafe_b64decode(data).decode('utf-8')
        return body


    def list_inbox_emails(self, max_results: int = 20, page_token: str = "") -> 'PaginatedEmails':
        """List emails from Inbox."""
        kwargs = {
            'userId': 'me',
            'labelIds': ['INBOX'],
            'maxResults': max_results
        }
        if page_token:
            kwargs['pageToken'] = page_token
            
        results = self.service.users().messages().list(**kwargs).execute()
        messages = results.get('messages', [])
        next_page_token = results.get('nextPageToken')
        
        previews = []
        
        if not messages:
            return PaginatedEmails(messages=[], nextPageToken=None)

        # Batch get for better performance could be done here, but simple loop for now as per req
        for msg in messages:
            # We need format=metadata to get headers for preview without full body
            # But snippet is also useful
            try:
                m = self.service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                
                headers = m['payload']['headers']
                sender = self._parse_header(headers, 'From')
                subject = self._parse_header(headers, 'Subject')
                date_obj = self._parse_timestamp(m['internalDate'])
                
                previews.append(EmailPreview(
                    id=m['id'],
                    sender=sender,
                    subject=subject,
                    snippet=m.get('snippet', ''),
                    date=date_obj,
                    unread='UNREAD' in m['labelIds']
                ))
            except Exception as e:
                print(f"Error fetching message {msg['id']}: {e}")
                continue
            
        return PaginatedEmails(messages=previews, nextPageToken=next_page_token)


    def list_sent_emails(self, max_results: int = 10, page_token: str = "") -> 'PaginatedEmails':
        """List emails from Sent folder."""
        kwargs = {
            'userId': 'me',
            'labelIds': ['SENT'],
            'maxResults': max_results
        }
        if page_token:
            kwargs['pageToken'] = page_token

        results = self.service.users().messages().list(**kwargs).execute()
        messages = results.get('messages', [])
        next_page_token = results.get('nextPageToken')
        
        previews = []

        if not messages:
            return PaginatedEmails(messages=[], nextPageToken=None)

        for msg in messages:
             try:
                 m = self.service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                 headers = m['payload']['headers']
                 sender = self._parse_header(headers, 'To') # For sent, showing To is usually more relevant, allowing flex
                 subject = self._parse_header(headers, 'Subject')
                 date_obj = self._parse_timestamp(m['internalDate'])
                 
                 previews.append(EmailPreview(
                    id=m['id'],
                    sender=sender,
                    subject=subject,
                    snippet=m.get('snippet', ''),
                    date=date_obj,
                    unread=False # Sent items are read usually
                 ))
             except Exception as e:
                 print(f"Error fetching message {msg['id']}: {e}")
                 continue
                 
        return PaginatedEmails(messages=previews, nextPageToken=next_page_token)


    def get_email_detail(self, message_id: str) -> EmailDetail:
        """Get full details of a specific email."""
        m = self.service.users().messages().get(userId='me', id=message_id, format='full').execute()
        
        headers = m['payload']['headers']
        sender = self._parse_header(headers, 'From')
        subject = self._parse_header(headers, 'Subject')
        date_obj = self._parse_timestamp(m['internalDate'])
        body = self._get_body(m['payload'])
        
        return EmailDetail(
            id=m['id'],
            sender=sender,
            subject=subject,
            date=date_obj,
            body=body,
            dataset='gmail',
            unread='UNREAD' in m['labelIds']
        )


    def send_email(self, to: list[str], subject: str, body: str):
        """Send an email."""
        message = MIMEText(body)
        message['to'] = ", ".join(to)
        message['subject'] = subject
        # message['from'] is set by Gmail automatically
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        body = {'raw': raw_message}
        
        self.service.users().messages().send(userId='me', body=body).execute()

    def search_emails(self, query: str) -> list[EmailPreview]:
        """Search emails using Gmail query parsing."""
        results = self.service.users().messages().list(userId='me', q=query).execute()
        messages = results.get('messages', [])
        previews = []

        if not messages:
            return []

        # Cap search results to avoid long waits for this MVP
        for msg in messages[:20]:
             m = self.service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
             headers = m['payload']['headers']
             sender = self._parse_header(headers, 'From')
             subject = self._parse_header(headers, 'Subject')
             date_obj = self._parse_timestamp(m['internalDate'])
             
             previews.append(EmailPreview(
                id=m['id'],
                sender=sender,
                subject=subject,
                snippet=m.get('snippet', ''),
                date=date_obj,
                unread='UNREAD' in m['labelIds']
            ))
        return previews
