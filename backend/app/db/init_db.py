from app.db.base import Base
from app.db.session import engine
from app.models import gmail_token # Import models to ensure they are registered

def init_db():
    Base.metadata.create_all(bind=engine)
