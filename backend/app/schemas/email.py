from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class EmailPreview(BaseModel):
    id: str
    sender: str
    subject: str
    snippet: str
    date: datetime
    unread: bool

class SendEmailRequest(BaseModel):
    to: List[EmailStr]
    subject: str
    body: str

class EmailDetail(BaseModel):
    id: str
    sender: str
    subject: str
    date: datetime
    body: str
    dataset: str # 'inbox' or 'sent' etc, metadata if needed
    unread: bool

class PaginatedEmails(BaseModel):
    messages: List[EmailPreview]
    nextPageToken: Optional[str] = None

class ReplyEmailRequest(BaseModel):
    body: str

class ForwardEmailRequest(BaseModel):
    to: List[EmailStr]
    body: str
