import pytest
from app.services.admin_user_service import AdminUserService


def test_create_user_invalid_role():
    with pytest.raises(ValueError, match="tidak valid"):
        AdminUserService.create_user(
            email="invalid@omnix.com",
            password="password123",
            full_name="Invalid Role User",
            role="super_hacker",
        )


def test_reset_password_too_short():
    with pytest.raises(ValueError, match="minimal 6 karakter"):
        AdminUserService.reset_user_password(
            user_id="00000000-0000-0000-0000-000000000001",
            new_password="123",
        )
