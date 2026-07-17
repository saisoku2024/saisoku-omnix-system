import os
from secrets import compare_digest

from fastapi import Header, HTTPException, status


def require_admin_token(
    authorization: str | None = Header(default=None),
    x_admin_token: str | None = Header(default=None),
) -> None:
    expected_token = os.getenv("ADMIN_API_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API token is not configured",
        )

    supplied_token = x_admin_token
    if authorization and authorization.lower().startswith("bearer "):
        supplied_token = authorization[7:].strip()

    if not supplied_token or not compare_digest(supplied_token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API token",
        )
