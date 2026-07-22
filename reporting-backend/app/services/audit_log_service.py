import json
from typing import Dict, Any, Optional
from app.core.supabase import supabase

class AuditLogService:
    @staticmethod
    def log(
        action: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None,
        user_email: str = "system@omnix.com",
        user_role: str = "admin",
    ) -> bool:
        """
        Mencatat entri aktivitas baru ke tabel public.audit_logs.
        """
        try:
            payload = {
                "action": action,
                "resource": resource,
                "user_email": user_email,
                "user_role": user_role,
                "details": details or {},
            }
            supabase.table("audit_logs").insert(payload).execute()
            return True
        except Exception as e:
            print(f"AUDIT LOG INSERT WARNING: {str(e)}")
            return False

    @staticmethod
    def list_logs(limit: int = 100, action: Optional[str] = None) -> Dict[str, Any]:
        """
        Mengambil riwayat audit log terbaru.
        """
        try:
            query = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(limit)
            if action:
                query = query.eq("action", action)

            res = query.execute()
            logs = res.data or []
            return {
                "total": len(logs),
                "logs": logs
            }
        except Exception as e:
            err_msg = str(e)
            if "relation \"public.audit_logs\" does not exist" in err_msg or "42P01" in err_msg:
                print("WARNING: Tabel public.audit_logs belum dibuat di Supabase SQL Editor.")
                return {"total": 0, "logs": [], "warning": "Tabel public.audit_logs belum dibuat di Supabase SQL Editor."}
            raise e
