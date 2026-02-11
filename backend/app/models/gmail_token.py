from sqlalchemy import Column, Integer, String, DateTime
from app.db.base import Base

class GmailToken(Base):
    """
    Stores OAuth2 tokens for the single user of this system.
    Authentication flows should upsert to this table (ensure only one row essentially or grab the latest).
    """
    __tablename__ = "gmail_tokens"

    id = Column(Integer, primary_key=True, index=True)

    # Email address of the user (unique identifier)
    email = Column(String, unique=True, index=True, nullable=False)

    # Access token used for API calls, creating short-lived credentials
    access_token = Column(String, nullable=False)
    
    # Refresh token used to obtain new access tokens when they expire
    refresh_token = Column(String, nullable=False)

    # Expiry time of the access token
    expiry = Column(DateTime, nullable=False)
