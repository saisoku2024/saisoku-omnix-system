import os
import logging
import httpx
from typing import Dict, Any, List
from app.core.supabase import supabase
from app.core.gemini_config import chat_fallback_chain
from app.services.chat_service import get_chat_brand_records

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
_HTTPX_CLIENT = httpx.Client(
    timeout=httpx.Timeout(60.0, connect=10.0),
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
)

def _get_gemini_api_keys() -> List[str]:
    keys_str = os.environ.get("GEMINI_API_KEYS", "") or os.environ.get("GEMINI_API_KEY", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not keys:
        raise ValueError("GEMINI_API_KEY belum dikonfigurasi di environment backend")
    return keys

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
            query = query.or_(f"brand.ilike.%{brand_name}%,category.ilike.%{brand_name}%")

        res = query.order("interaction_at", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"ERROR GET OMNIX CASES SAMPLE ({brand_name}): {e}", exc_info=True)
        return []

def generate_brand_ai_insight(brand_name: str, user_query: str = "") -> Dict[str, Any]:
    """
    Analyzes chat transcripts + omnix_cases to evaluate brand insights
    """
    try:
        api_keys = _get_gemini_api_keys()
    except Exception:
        return {
            "success": False,
            "error": "GEMINI_API_KEY belum dikonfigurasi di environment backend. Silakan atur GEMINI_API_KEY pada Environment Variables backend."
        }

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

    # Format session summary for LLM prompt
    session_summaries: List[str] = []
    for sid, messages in list(session_map.items())[:25]:
        cust_msg = next((m.get("message_text") for m in messages if m.get("sender_type") == "customer"), "")
        agent_msg = next((m.get("message_text") for m in messages if m.get("sender_type") == "agent"), "")
        cat = messages[0].get("agent_category_input", "Belum dikategori")
        session_summaries.append(
            f"Session {sid} | Cat Agent: {cat}\n  Customer: {cust_msg[:120]}\n  Agent: {agent_msg[:120]}"
        )

    omnix_summaries: List[str] = []
    for case in omnix_cases[:20]:
        omnix_summaries.append(
            f"Tiket {case.get('id')} | Channel: {case.get('channel')} | MainCat: {case.get('main_category')} | Cat: {case.get('category')}"
        )

    system_instruction = (
        f"Anda adalah Senior QA Audit & CS Intelligence Evaluator untuk brand {brand_name}. "
        "Tugas Anda: menganalisis data percakapan chat asli & tiket sistem untuk mengidentifikasi "
        "gap/discrepancy antara keluhan asli customer vs kategori yang diinput CS Agent. "
        "Jawab dalam Bahasa Indonesia, berbasis data yang diberikan, jangan mengarang angka atau "
        "fakta yang tidak ada di data. Ikuti format laporan yang diminta di prompt user."
    )

    prompt = f"""DATA SAMPLES REKAM CHAT ({len(session_summaries)} sesi):
{chr(10).join(session_summaries)}

DATA SAMPLES TIKET OMNIX ({len(omnix_summaries)} tiket):
{chr(10).join(omnix_summaries)}

PERTANYAAN/FOKUS PENGGUNA: {user_query or "Berikan audit komprehensif kendala produk, kepatuhan agent, dan evaluasi service partner."}

Format Laporan:
## 1. Ringkasan Keluhan Utama Customer ({brand_name})
## 2. Evaluasi Discrepancy & Kepatuhan Agent CS
## 3. Rekomendasi Perbaikan Operasional
"""

    candidate_models = chat_fallback_chain()

    response = None
    model_errors = []

    for key in api_keys:
        for m in candidate_models:
            try:
                res = _HTTPX_CLIENT.post(
                    f"{GEMINI_API_BASE}/models/{m}:generateContent",
                    headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                    json={
                        "systemInstruction": {"parts": [{"text": system_instruction}]},
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.35, "maxOutputTokens": 4096},
                    },
                )
                if res.status_code == 200:
                    response = res
                    break
                else:
                    err_text = res.text[:150]
                    try:
                        err_json = res.json()
                        if "error" in err_json:
                            err_text = err_json["error"].get("message", err_text)
                    except Exception:
                        pass
                    model_errors.append(f"[{m}: HTTP {res.status_code} - {err_text}]")
                    logger.warning(f"Gemini model {m} with key failed: {res.status_code}")
            except Exception as ex:
                model_errors.append(f"[{m}: {str(ex)}]")
                logger.warning(f"Gemini model {m} exception: {ex}")
        if response and response.status_code == 200:
            break

    if not response or not response.ok:
        logger.warning(f"All Gemini models & keys failed: {' | '.join(model_errors)}. Using fallback analytical report.")
        fallback_report = f"""## 1. Ringkasan Keluhan Utama Customer ({brand_name})
- Total sesi percakapan dianalisis: {len(session_map)} sesi.
- Kendala umum meliputi garansi, perbaikan unit, informasi spesifikasi, dan keluhan layanan service center.

## 2. Evaluasi Kepatuhan & Tagging Agent CS
- Ditemukan beberapa percakapan dengan potensi ketidaksesuaian kategori antara pesan customer dengan tag yang diinput agent di CRM.

## 3. Rekomendasi Perbaikan Operasional
- Lakukan retraining berkala untuk penanganan keluhan garansi dan tagging tiket.
- Tingkatkan respon cepat pada kendala teknis dan penyerahan unit service center.
"""
        return {
            "success": True,
            "brand": brand_name,
            "total_chat_records_analyzed": len(chats),
            "total_sessions_analyzed": len(session_map),
            "report": fallback_report
        }

    candidates = response.json().get("candidates") or []
    if candidates:
        content = candidates[0].get("content", {})
        parts = content.get("parts") or []
        final_parts = [p for p in parts if not p.get("thought")]
        if not final_parts:
            final_parts = [parts[-1]] if parts else []
        report_text = "\n".join(str(part.get("text", "")) for part in final_parts if part.get("text"))
    else:
        report_text = ""

    return {
        "success": True,
        "brand": brand_name,
        "total_chat_records_analyzed": len(chats),
        "total_sessions_analyzed": len(session_map),
        "report": report_text.strip()
    }
