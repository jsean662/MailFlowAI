from pydantic import BaseModel
from typing import Optional

class TokenResponse(BaseModel):
    authenticated: bool
    email: Optional[str] = None
