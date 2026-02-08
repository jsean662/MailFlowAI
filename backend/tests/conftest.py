import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Generator

from app.main import app
from app.db.session import get_db
from app.db.base import Base
from app.services.gmail_service import GmailService
from app.api.routes.gmail import get_gmail_service

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session() -> Generator:
    """
    Create a fresh database session for each test.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """
    Create a TestClient with a specific database session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def mock_gmail_service(mocker):
    """
    Mock the GmailService used in dependencies.
    """
    mock_service = mocker.Mock(spec=GmailService)
    return mock_service

@pytest.fixture
def client_with_mocked_gmail(client, mock_gmail_service):
    """
    Fixture that overrides the get_gmail_service dependency with a mock.
    """
    app.dependency_overrides[get_gmail_service] = lambda: mock_gmail_service
    yield client
    app.dependency_overrides.pop(get_gmail_service, None)
