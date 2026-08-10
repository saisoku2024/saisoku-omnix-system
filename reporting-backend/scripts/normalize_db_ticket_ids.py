import os
import re
import sys
from pathlib import Path
from dotenv import load_dotenv

current_dir = Path(__file__).parent.parent
load_dotenv(dotenv_path=current_dir / ".env")

from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset di .env")
    sys.exit(1)

supabase = create_client(url, key)


def normalize_ticket_id(v):
    if not v:
        return None
    s = str(v).strip()
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]

    match = re.match(r"^(?:TICKET\s*[-_]?\s*)?(\d+)$", s, re.IGNORECASE)
    if match:
        digits = match.group(1).lstrip("0")
        if not digits:
            digits = "0"
        return f"TICKET-{digits.zfill(10)}"
    return s


def main():
    apply_changes = "--apply" in sys.argv
    print(f"=== SIVA DB TICKET ID NORMALIZATION ({'EXECUTE/APPLY' if apply_changes else 'DRY-RUN / PREVIEW'}) ===")

    print("Mengambil data omnix_cases yang ticket_id-nya belum berformat TICKET-...")
    res = (
        supabase.table("omnix_cases")
        .select("id, ticket_id, interaction_at, customer_hp")
        .not_.ilike("ticket_id", "TICKET-%")
        .execute()
    )

    rows = res.data or []
    print(f"Ditemukan {len(rows)} baris yang membutuhkan normalisasi format ticket_id.")

    updates = []
    for r in rows:
        old_id = r["ticket_id"]
        new_id = normalize_ticket_id(old_id)
        if old_id != new_id:
            updates.append({"id": r["id"], "old_ticket_id": old_id, "new_ticket_id": new_id})

    print(f"Total baris yang akan diperbarui formatnya: {len(updates)}")
    if updates:
        print("Contoh perubahan:")
        for u in updates[:10]:
            print(f"  ID {u['id']}: {u['old_ticket_id']}  ===>  {u['new_ticket_id']}")

    if apply_changes:
        print("\nMenerapkan perubahan ke database Supabase...")
        success_count = 0
        duplicate_conflicts = 0

        for u in updates:
            try:
                supabase.table("omnix_cases").update({"ticket_id": u["new_ticket_id"]}).eq("id", u["id"]).execute()
                success_count += 1
            except Exception as e:
                if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                    duplicate_conflicts += 1
                    print(f"  [Conflict/Duplicate] ID {u['id']} ({u['new_ticket_id']}) sudah ada di database.")
                else:
                    print(f"  [Error] Gagal update ID {u['id']}: {e}")

        print(f"\n[SUCCESS] Completed! Successfully updated: {success_count}, Duplicates skipped: {duplicate_conflicts}")
    else:
        print("\n[PREVIEW] Ini adalah PREVIEW (Dry-Run). Tidak ada data DB yang diubah.")
        print("Jalankan script ini dengan argumen '--apply' jika ingin mengeksekusi ke database.")


if __name__ == "__main__":
    main()
