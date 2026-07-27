import logging
import os
from secrets import compare_digest

from fastapi import Header, HTTPException, status

logger = logging.getLogger(__name__)


def require_admin_token(
    authorization: str | None = Header(default=None),
    x_admin_token: str | None = Header(default=None),
) -> None:
    expected_token = os.getenv("ADMIN_API_TOKEN")

    if not expected_token:
        logger.error("Admin API token is not configured in backend environment")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API token is not configured",
        )

    supplied_token = x_admin_token
    if authorization and authorization.lower().startswith("bearer "):
        supplied_token = authorization[7:].strip()

    if not supplied_token or not compare_digest(supplied_token, expected_token):
        logger.warning(f"Admin API token verification failed for supplied token: {supplied_token[:4] if supplied_token else 'NONE'}***")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API token",
        )
