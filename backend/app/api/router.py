from fastapi import APIRouter
from app.api.routes import auth, gmail, health

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(gmail.router, prefix="/gmail", tags=["gmail"])
api_router.include_router(health.router, tags=["health"])
