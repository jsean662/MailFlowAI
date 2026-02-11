from sqlalchemy.orm import Session
from app.models.gmail_token import GmailToken
from datetime import datetime

class TokenService:
    @staticmethod
    def save_tokens(db: Session, email: str, access_token: str, refresh_token: str, expiry: datetime) -> GmailToken:
        """
        Save or update tokens for a specific user.
        """
        token_entry = db.query(GmailToken).filter(GmailToken.email == email).first()
        if not token_entry:
            token_entry = GmailToken(
                email=email,
                access_token=access_token,
                refresh_token=refresh_token,
                expiry=expiry
            )
            db.add(token_entry)
        else:
            token_entry.access_token = access_token
            # Only update refresh token if a new one is provided
            if refresh_token:
                token_entry.refresh_token = refresh_token
            token_entry.expiry = expiry
        
        db.commit()
        db.refresh(token_entry)
        return token_entry

    @staticmethod
    def get_tokens(db: Session, email: str) -> GmailToken:
        """
        Retrieve the stored tokens for a specific user.
        """
        return db.query(GmailToken).filter(GmailToken.email == email).first()

    @staticmethod
    def clear_tokens(db: Session, email: str):
        """
        Clear stored tokens for a specific user (logout).
        """
        db.query(GmailToken).filter(GmailToken.email == email).delete()
        db.commit()
