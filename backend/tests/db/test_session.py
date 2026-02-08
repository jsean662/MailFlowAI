from app.db.session import get_db, SessionLocal
from sqlalchemy.orm import Session

def test_get_db():
    """
    Test the get_db dependency generator.
    """
    # Create a generator
    gen = get_db()
    
    # Get the session
    db = next(gen)
    
    assert isinstance(db, Session)
    
    # Verify we can use it (e.g. check active transaction or open status)
    # SQLAlchemy sessions are usually open until closed.
    assert db.is_active
    
    # Close it by exhausting generator (simulating dependency cleanup)
    try:
        next(gen)
    except StopIteration:
        pass
        
    # After cleanup, we can't easily check if it's closed on the object itself generically 
    # without deeper introspection, but the coverage execution dictates we ran the finally block code.
