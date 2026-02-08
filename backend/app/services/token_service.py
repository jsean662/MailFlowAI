from sqlalchemy.orm import Session
from app.models.gmail_token import GmailToken
from datetime import datetime

class TokenService:
    @staticmethod
    def save_tokens(db: Session, access_token: str, refresh_token: str, expiry: datetime) -> GmailToken:
        """
        Save or update tokens. Since this is a single user system, we simply
        check if a token row exists and update it, or create a new one.
        """
        token_entry = db.query(GmailToken).first()
        if not token_entry:
            token_entry = GmailToken(
                access_token=access_token,
                refresh_token=refresh_token,
                expiry=expiry
            )
            db.add(token_entry)
        else:
            token_entry.access_token = access_token
            # Only update refresh token if a new one is provided (sometimes refresh usually stays valid longer)
            # Google doesn't always return a new refresh token on refresh
            if refresh_token:
               token_entry.refresh_token = refresh_token
            token_entry.expiry = expiry
        
        db.commit()
        db.refresh(token_entry)
        return token_entry

    @staticmethod
    def get_tokens(db: Session) -> GmailToken:
        """
        Retrieve the stored tokens.
        """
        return db.query(GmailToken).first()

    @staticmethod
    def clear_tokens(db: Session):
        """
        Clear stored tokens (logout).
        """
        db.query(GmailToken).delete()
        db.commit()
