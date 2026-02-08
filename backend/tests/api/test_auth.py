from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.services.token_service import TokenService

def test_login_redirect(client: TestClient):
    """
    Test that /auth/login redirects to Google OAuth URL.
    """
    response = client.get("/api/auth/login", follow_redirects=False)
    assert response.status_code == 307
    assert "accounts.google.com" in response.headers["location"]
    # The current implementation returns a RedirectResponse which behaves as a 307/302 usually, 
    # but TestClient follows redirects by default. 
    
    # Actually, TestClient by default follows redirects. 
    # The response.url would likely be the google auth url if we follow it.
    # However, since we can't actually hit google in tests without network or complex mocking of google,
    # we should check if the response HISTORY contains the redirect or prevent following redirects.
    
    client = TestClient(client.app) # New client to ensure clean state
    response = client.get("/api/auth/login", follow_redirects=False)
    assert response.status_code == 307
    assert "accounts.google.com" in response.headers["location"]

def test_auth_status_unauthenticated(client: TestClient):
    """
    Test /auth/status when no tokens mock exist.
    """
    response = client.get("/api/auth/status")
    assert response.status_code == 200
    assert response.json() == {"authenticated": False}

def test_auth_status_authenticated(client: TestClient, db_session):
    """
    Test /auth/status when tokens exist in DB.
    """
    from datetime import datetime
    TokenService.save_tokens(db_session, "access", "refresh", datetime.utcnow())
    
    response = client.get("/api/auth/status")
    assert response.status_code == 200
    assert response.json() == {"authenticated": True}

def test_logout(client: TestClient, db_session):
    """
    Test /auth/logout clears tokens.
    """
    from datetime import datetime
    TokenService.save_tokens(db_session, "access", "refresh", datetime.utcnow())
    
    response = client.get("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"message": "Logged out successfully"}
    
    assert TokenService.get_tokens(db_session) is None

@patch("app.api.routes.auth.Flow")
def test_callback_success(mock_flow_class, client: TestClient, db_session):
    """
    Test /auth/callback successfully exchanges code for tokens.
    """
    mock_flow_instance = MagicMock()
    mock_flow_class.from_client_config.return_value = mock_flow_instance
    
    # Mock credentials
    mock_creds = MagicMock()
    mock_creds.token = "new_access_token"
    mock_creds.refresh_token = "new_refresh_token"
    mock_creds.expiry = None # Will force logic to calculate expiry
    
    mock_flow_instance.credentials = mock_creds
    
    response = client.get("/api/auth/callback?code=fake_code", follow_redirects=False)
    
    assert response.status_code == 307 # Redirects to frontend
    
    mock_flow_instance.fetch_token.assert_called_with(code="fake_code")
    
    # Verify tokens saved in DB
    tokens = TokenService.get_tokens(db_session)
    assert tokens.access_token == "new_access_token"
    assert tokens.refresh_token == "new_refresh_token"


@patch("app.api.routes.auth.build")
def test_get_user_profile_success(mock_build, client: TestClient, db_session):
    """
    Test /me returns user profile when authenticated.
    """
    # Mock tokens existence
    from datetime import datetime
    TokenService.save_tokens(db_session, "access", "refresh", datetime.utcnow())
    
    # Mock Google API service
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    
    mock_service.userinfo().get().execute.return_value = {
        "email": "test@example.com",
        "name": "Test User",
        "picture": "http://example.com/pic.jpg"
    }
    
    response = client.get("/api/auth/me")
    
    assert response.status_code == 200
    assert response.json() == {
        "email": "test@example.com",
        "name": "Test User",
        "picture": "http://example.com/pic.jpg"
    }

def test_get_user_profile_no_tokens(client: TestClient, db_session):
    """
    Test /me returns 401 when no tokens exist.
    """
    # Ensure no tokens
    TokenService.clear_tokens(db_session)
    
    response = client.get("/api/auth/me")
    
    assert response.status_code == 401
    assert response.json()["detail"]["error"] == "AUTH_REQUIRED"

@patch("app.api.routes.auth.build")
def test_get_user_profile_error(mock_build, client: TestClient, db_session):
    """
    Test /me returns 401 when Google API fails (e.g. revoked token).
    """
    from datetime import datetime
    TokenService.save_tokens(db_session, "access", "refresh", datetime.utcnow())
    
    # Mock exception
    mock_build.side_effect = Exception("Google API Error")
    
    response = client.get("/api/auth/me")
    
    assert response.status_code == 401
    assert response.json()["detail"]["error"] == "AUTH_FAILED"
