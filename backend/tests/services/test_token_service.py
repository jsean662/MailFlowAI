from app.services.token_service import TokenService
from app.models.gmail_token import GmailToken
from datetime import datetime, timedelta

def test_save_tokens(db_session):
    access = "access123"
    refresh = "refresh123"
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    token = TokenService.save_tokens(db_session, access, refresh, expiry)
    
    assert token.access_token == access
    assert token.refresh_token == refresh
    assert token.expiry == expiry
    
    # Verify DB state
    db_token = db_session.query(GmailToken).first()
    assert db_token is not None
    assert db_token.access_token == access

def test_update_tokens(db_session):
    # Initial save
    expiry = datetime.utcnow()
    TokenService.save_tokens(db_session, "old_access", "old_refresh", expiry)
    
    # Update
    new_expiry = datetime.utcnow() + timedelta(hours=1)
    TokenService.save_tokens(db_session, "new_access", "new_refresh", new_expiry)
    
    db_token = db_session.query(GmailToken).first()
    assert db_token.access_token == "new_access"
    assert db_token.refresh_token == "new_refresh"
    assert db_token.expiry == new_expiry

def test_update_tokens_no_refresh(db_session):
    # Initial save
    TokenService.save_tokens(db_session, "old_access", "old_refresh", datetime.utcnow())
    
    # Update without refresh token (common in OAuth refresh flow)
    TokenService.save_tokens(db_session, "new_access", None, datetime.utcnow())
    
    db_token = db_session.query(GmailToken).first()
    assert db_token.access_token == "new_access"
    assert db_token.refresh_token == "old_refresh" # Should persist old refresh token

def test_get_tokens(db_session):
    assert TokenService.get_tokens(db_session) is None
    
    TokenService.save_tokens(db_session, "a", "r", datetime.utcnow())
    assert TokenService.get_tokens(db_session) is not None

def test_clear_tokens(db_session):
    TokenService.save_tokens(db_session, "a", "r", datetime.utcnow())
    TokenService.clear_tokens(db_session)
    assert TokenService.get_tokens(db_session) is None
