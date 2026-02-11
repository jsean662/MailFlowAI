from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.constants import SCOPES
from app.services.token_service import TokenService
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os

router = APIRouter()

# Allow HTTP for local testing and relax scope validation
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'


@router.get("/login")
def login():
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    return RedirectResponse(authorization_url)


@router.get("/callback")
def callback(request: Request, code: str, db: Session = Depends(get_db)):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )
    
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    try:
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info.get('email')
        if not email:
             raise HTTPException(status_code=400, detail="Could not retrieve email from Google")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to fetch user info: {str(e)}")

    # Calculate expiry
    expiry = credentials.expiry if credentials.expiry else datetime.utcnow() + timedelta(hours=1)
    
    TokenService.save_tokens(
        db, 
        email=email,
        access_token=credentials.token, 
        refresh_token=credentials.refresh_token,
        expiry=expiry
    )
    
    # Store user identity in session
    request.session["user"] = email
    
    return RedirectResponse(f"{settings.FRONTEND_URL}")


@router.get("/status")
def status(request: Request, db: Session = Depends(get_db)):
    user_email = request.session.get("user")
    if not user_email:
        return {"authenticated": False}
        
    tokens = TokenService.get_tokens(db, email=user_email)
    return {"authenticated": tokens is not None}


@router.get("/me")
def get_user_profile(request: Request, db: Session = Depends(get_db)):
    """Get the authenticated user's profile information."""
    user_email = request.session.get("user")
    if not user_email:
        raise HTTPException(status_code=401, detail={"error": "AUTH_REQUIRED", "message": "User must login"})

    tokens = TokenService.get_tokens(db, email=user_email)
    if not tokens:
        raise HTTPException(status_code=401, detail={"error": "AUTH_REQUIRED", "message": "User must login"})
    
    try:
        creds = Credentials(
            token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )
        
        # Build the OAuth2 service to get user info
        oauth2_service = build('oauth2', 'v2', credentials=creds)
        user_info = oauth2_service.userinfo().get().execute()
        
        return {
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail={"error": "AUTH_FAILED", "message": str(e)})


@router.get("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    user_email = request.session.get("user")
    if user_email:
        TokenService.clear_tokens(db, email=user_email)
    request.session.clear()
    return {"message": "Logged out successfully"}
