import os
from typing import List, Dict, Any, Optional
from app.core.supabase import supabase

class AdminUserService:
    @staticmethod
    def list_users() -> Dict[str, Any]:
        """
        Mengambil seluruh user terdaftar dari tabel public.profiles.
        """
        response = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        users = response.data or []
        return {
            "total": len(users),
            "users": users
        }

    @staticmethod
    def create_user(email: str, password: str, full_name: str, role: str = "guest", brand_access: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Membuat akun user baru di Supabase Auth Admin & otomatis membuat entri di public.profiles.
        """
        allowed_roles = ["super_admin", "manager", "spv", "agent", "guest"]
        if role not in allowed_roles:
            raise ValueError(f"Role '{role}' tidak valid. Pilih dari: {', '.join(allowed_roles)}")

        if not brand_access:
            brand_access = ["ALL"]

        # Call Supabase Auth Admin Sign Up
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "role": role,
            }
        })

        if not auth_response.user:
            raise Exception("Gagal membuat user di Supabase Auth")

        user_id = auth_response.user.id

        # Upsert profile record
        profile_payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "brand_access": brand_access
        }

        profile_res = supabase.table("profiles").upsert(profile_payload).execute()
        created_profile = profile_res.data[0] if profile_res.data else profile_payload

        return created_profile

    @staticmethod
    def update_user_role(user_id: str, role: Optional[str] = None, full_name: Optional[str] = None, brand_access: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Memperbarui role, nama, atau akses brand user pada tabel public.profiles.
        """
        update_data = {}
        if role:
            allowed_roles = ["super_admin", "manager", "spv", "agent", "guest"]
            if role not in allowed_roles:
                raise ValueError(f"Role '{role}' tidak valid.")
            update_data["role"] = role

        if full_name:
            update_data["full_name"] = full_name

        if brand_access is not None:
            update_data["brand_access"] = brand_access

        if not update_data:
            raise ValueError("Tidak ada data yang diperbarui")

        response = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        if not response.data:
            raise Exception("User tidak ditemukan atau gagal diperbarui")

        return response.data[0]

    @staticmethod
    def delete_user(user_id: str) -> bool:
        """
        Menghapus user dari Supabase Auth (otomatis memicu ON DELETE CASCADE pada public.profiles).
        """
        try:
            supabase.auth.admin.delete_user(user_id)
            return True
        except Exception as e:
            # Fallback delete profile if auth delete fails
            supabase.table("profiles").delete().eq("id", user_id).execute()
            return True
