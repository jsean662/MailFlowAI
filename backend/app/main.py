from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.db.init_db import init_db
import uvicorn

from starlette.middleware.sessions import SessionMiddleware

app = FastAPI(title=settings.PROJECT_NAME)

# Add Session Middleware
session_config = {"secret_key": settings.SECRET_KEY}
if settings.FRONTEND_URL.startswith("https://"):
    session_config["same_site"] = "none"
    session_config["https_only"] = True
else:
    session_config["same_site"] = "lax"
    session_config["https_only"] = False

app.add_middleware(SessionMiddleware, **session_config)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
