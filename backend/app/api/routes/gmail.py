from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.token_service import TokenService
from app.services.gmail_service import GmailService
from app.schemas.email import EmailPreview, SendEmailRequest, EmailDetail, PaginatedEmails
from app.core.config import settings
from app.core.cache import cache_response

router = APIRouter()

def get_gmail_service(db: Session = Depends(get_db)) -> GmailService:
    tokens = TokenService.get_tokens(db)
    if not tokens:
        raise HTTPException(status_code=401, detail={"error": "AUTH_REQUIRED", "message": "User must login again"})
    
    token_data = {
        'access_token': tokens.access_token,
        'refresh_token': tokens.refresh_token,
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET
    }
    
    try:
        service = GmailService(token_data)
        return service
    except Exception as e:
        # If refreshing fails or other auth issues
        raise HTTPException(status_code=401, detail={"error": "AUTH_FAILED", "message": str(e)})

@router.get("/inbox", response_model=PaginatedEmails)
@cache_response(ttl_seconds=300)
def get_inbox(page_token: str = Query(None), service: GmailService = Depends(get_gmail_service)):
    return service.list_inbox_emails(page_token=page_token)

@router.get("/sent", response_model=PaginatedEmails)
@cache_response(ttl_seconds=300)
def get_sent(page_token: str = Query(None), service: GmailService = Depends(get_gmail_service)):
    return service.list_sent_emails(page_token=page_token)

@router.get("/messages/{message_id}", response_model=EmailDetail)
@cache_response(ttl_seconds=600)
def get_message_detail(message_id: str, service: GmailService = Depends(get_gmail_service)):
    return service.get_email_detail(message_id)

@router.post("/send")
def send_email(request: SendEmailRequest, service: GmailService = Depends(get_gmail_service)):
    service.send_email(request.to, request.subject, request.body)
    return {"status": "sent"}

@router.get("/search", response_model=list[EmailPreview])
@cache_response(ttl_seconds=300)
def search_emails(q: str = Query(..., description="Gmail search query"), service: GmailService = Depends(get_gmail_service)):
    return service.search_emails(q)
