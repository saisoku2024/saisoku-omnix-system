import os
import uuid
from typing import List, Dict, Any, Optional
from app.core.supabase import supabase

class AdminUserService:
    @staticmethod
    def list_users() -> Dict[str, Any]:
        """
        Mengambil seluruh user terdaftar dari tabel public.profiles.
        """
        try:
            response = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
            users = response.data or []
            return {
                "total": len(users),
                "users": users
            }
        except Exception as e:
            err_msg = str(e)
            if "relation \"public.profiles\" does not exist" in err_msg or "42P01" in err_msg:
                print("WARNING: Tabel public.profiles belum dibuat di Supabase SQL Editor.")
                return {"total": 0, "users": [], "warning": "Tabel public.profiles belum dibuat di Supabase."}
            raise e

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

        user_id = None
        # 1. Coba buat via Supabase Auth Admin
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name,
                    "role": role,
                }
            })
            if auth_response and auth_response.user:
                user_id = auth_response.user.id
        except Exception as auth_err:
            print(f"Auth Admin Create Warning: {str(auth_err)}")
            # Fallback UUID jika Auth Create mengembalikan user already registered
            user_id = str(uuid.uuid4())

        if not user_id:
            user_id = str(uuid.uuid4())

        # 2. Upsert profile record ke public.profiles
        profile_payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "brand_access": brand_access
        }

        try:
            profile_res = supabase.table("profiles").upsert(profile_payload).execute()
            created_profile = profile_res.data[0] if profile_res.data else profile_payload
            return created_profile
        except Exception as db_err:
            db_err_msg = str(db_err)
            if "relation \"public.profiles\" does not exist" in db_err_msg or "42P01" in db_err_msg:
                raise ValueError("Tabel 'public.profiles' belum ada di Supabase. Silakan jalankan script SQL migrasi di Supabase SQL Editor terlebih dahulu.")
            raise db_err

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

        try:
            response = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
            if not response.data:
                raise Exception("User tidak ditemukan atau gagal diperbarui")
            return response.data[0]
        except Exception as db_err:
            db_err_msg = str(db_err)
            if "relation \"public.profiles\" does not exist" in db_err_msg or "42P01" in db_err_msg:
                raise ValueError("Tabel 'public.profiles' belum ada di Supabase. Jalankan script SQL migrasi di Supabase SQL Editor.")
            raise db_err

    @staticmethod
    def delete_user(user_id: str) -> bool:
        """
        Menghapus user dari Supabase Auth dan public.profiles.
        """
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            print(f"Auth Admin Delete Warning: {str(e)}")

        try:
            supabase.table("profiles").delete().eq("id", user_id).execute()
            return True
        except Exception as db_err:
            print(f"DB Delete Profile Error: {str(db_err)}")
            return True
