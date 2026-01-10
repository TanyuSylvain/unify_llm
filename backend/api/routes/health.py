"""
Health check endpoints.
"""

from fastapi import APIRouter
from backend.api.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service status.
    """
    return HealthResponse(status="ok", message="Service is running")
