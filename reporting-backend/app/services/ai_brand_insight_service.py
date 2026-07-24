import os
import logging
import requests
from typing import Dict, Any, List
from app.core.supabase import supabase
from app.services.chat_service import get_chat_brand_records

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

def _get_gemini_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY belum dikonfigurasi di environment backend")
    return key

def _get_omnix_cases_sample(brand_name: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Fetches sample omnix_cases tickets for matching/comparing category inputs
    """
    try:
        query = (
            supabase.table("omnix_cases")
            .select("id,channel,main_category,category,brand,interaction_at,customer_hp")
            .is_("deleted_at", "null")
        )
        if brand_name.lower() != "all":
            # Match brand or category column
            query = query.or_(f"brand.ilike.%{brand_name}%,category.ilike.%{brand_name}%")

        res = query.order("interaction_at", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"ERROR GET OMNIX CASES SAMPLE ({brand_name}): {e}", exc_info=True)
        return []

def generate_brand_ai_insight(brand_name: str, user_query: str = "") -> Dict[str, Any]:
    """
    Analyzes chat transcripts + omnix_cases to evaluate:
    1. Real customer issues for the brand (Tineco, Ecovacs, Laifen, Tymo, Yoniev).
    2. Agent compliance & discrepancy between raw chat problem vs agent ticket categorization.
    3. Partner service performance (Unicom, Mitracare, Plaza Segi 8, PRJ, Tokopedia, etc.).
    """
    api_key = _get_gemini_api_key()
    model = DEFAULT_GEMINI_MODEL

    # Fetch data
    chats = get_chat_brand_records(brand_name, limit=150)
    omnix_cases = _get_omnix_cases_sample(brand_name, limit=50)

    if not chats and not omnix_cases:
        return {
            "success": True,
            "brand": brand_name,
            "report": f"Belum ada data percakapan chat atau tiket Omnix yang tercatat untuk brand '{brand_name}'. Silakan lakukan upload file rekam chat terlebih dahulu."
        }

    # Group chats by session
    session_map: Dict[str, List[Dict[str, Any]]] = {}
    for c in chats:
        sid = c.get("session_id", "unknown")
        if sid not in session_map:
            session_map[sid] = []
        session_map[sid].append(c)

    # Format chat transcripts context (up to 20 sessions for detailed analysis)
    formatted_chat_sessions = []
    for sid, msgs in list(session_map.items())[:25]:
        first_msg = msgs[0]
        channel = first_msg.get("channel_name", "-")
        agent = first_msg.get("agent_name", "-")
        partner = first_msg.get("detected_partner", "General")
        
        dialogue = []
        for m in msgs:
            sender = "Customer" if m.get("action_type") == "IN" else f"Agent ({m.get('agent_name')})"
            dialogue.append(f"[{sender}]: {m.get('message')}")

        formatted_chat_sessions.append(
            f"--- SESSION ID: {sid} | Channel: {channel} | Agent: {agent} | Partner Detected: {partner} ---\n"
            + "\n".join(dialogue)
        )

    chat_context = "\n\n".join(formatted_chat_sessions)

    # Format omnix_cases ticket system input sample
    formatted_cases = []
    for case in omnix_cases[:20]:
        formatted_cases.append(
            f"CaseID: {case.get('id')} | Date: {case.get('interaction_at')} | Channel: {case.get('channel')} | "
            f"Main Category Inputted: {case.get('main_category')} | Category Inputted: {case.get('category')}"
        )
    cases_context = "\n".join(formatted_cases) if formatted_cases else "Tidak ada sampel tiket terpisah."

    # Build Prompt for Gemini
    prompt = f"""
Anda adalah **Senior QA Audit & Brand Intelligence Analyst** untuk SAISOKU OMNIX System.
Tugas Anda adalah menganalisis data percakapan chat nyata pelanggan dan membandingkannya dengan inputan tiket sistem untuk brand **{brand_name.upper()}**.

Target Brand Utama: Tineco, Ecovacs, Laifen, Tymo, Yoniev.
Target Partner Service/Channel: Unicom, Mitracare, Plaza Segi 8 Surabaya, PRJ Kemayoran, Tokopedia, Shopee, dll.

--- DATA PERCAKAPAN CHAT NYATA (CHAT TRANSCRIPTS) ---
{chat_context}

--- SAMPEL INPUTAN TIKET OMNIX CASE OLEH AGEN ---
{cases_context}

--- PERTANYAAN/FOKUS PENGGUNA ---
{user_query if user_query else f"Jelaskan kondisi brand {brand_name}, kendala keluhan utama, sentimen, serta kesesuaian antara keluhan di chat dengan inputan agen di sistem Omnix."}

TOLONG SOSIALISASIKAN LAPORAN AUDIT & BRAND INSIGHT DALAM FORMAT MARKDOWN BAHASA INDONESIA YANG SANGAT RAPI DENGAN STRUKTUR BERIKUT:

# 📊 BRAND INTELLIGENCE & AGENT QA AUDIT: {brand_name.upper()}

### 1. Ringkasan Eksekutif & Sentimen Produk
- Status Sentimen Keseluruhan (% Positif vs % Negatif/Keluhan)
- Ringkasan Persepsi Pelanggan terhadap Produk {brand_name}

### 2. Kendala & Keluhan Utama Pelanggan (Real Customer Pain Points)
- Daftar kendala fisik/layanan terbanyak berdasarkan percakapan chat nyata (misal: Baterai cepat habis/rusak, garansi, sensor navigasi, kabel lepas, dll.)

### 3. Audit Ketidaksesuaian (Discrepancy Check: Chat Asli vs Inputan Agen)
- **Status Compliance Overall**: (% Sesuai / % Tidak Sesuai)
- **Temuan Mismatch Spesifik**: Sebutkan contoh kasus di mana masalah asli pelanggan di chat BERBEDA dengan kategori yang diinput agen di sistem (misal: Pelanggan komplain lama perbaikan di partner service, tetapi agen input "Informasi Umum").
- **Dampak Kualitas Data**: Jelaskan dampak salah kategorisasi tersebut terhadap keakuratan dashboard.

### 4. Evaluasi Performance Partner Service & Channel
- Evaluasi penanganan dari Partner Service (Unicom, Mitracare, Plaza Segi 8 Surabaya, dll.) dan Channel/Event (PRJ Kemayoran, WhatsApp, IG).

### 5. Rekomendasi Tindakan Operasional
- 3 Poin rekomendasi perbaikan untuk tim CS & Service Partner.
"""

    try:
        response = requests.post(
            f"{GEMINI_API_BASE}/models/{model}:generateContent",
            headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=90,
        )

        if not response.ok:
            logger.error(f"GEMINI BRAND INSIGHT ERROR: {response.text}")
            return {
                "success": False,
                "error": f"Gagal mendapatkan insight AI dari Gemini (HTTP {response.status_code})"
            }

        candidates = response.json().get("candidates") or []
        parts = (candidates[0].get("content", {}).get("parts") if candidates else []) or []
        report_text = "\n".join(str(part.get("text", "")) for part in parts if part.get("text"))

        return {
            "success": True,
            "brand": brand_name,
            "total_chat_records_analyzed": len(chats),
            "total_sessions_analyzed": len(session_map),
            "report": report_text.strip()
        }

    except Exception as e:
        logger.error(f"ERROR GENERATE BRAND AI INSIGHT ({brand_name}): {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
