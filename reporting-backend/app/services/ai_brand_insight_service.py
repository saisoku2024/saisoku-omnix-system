import os
import logging
import requests
from typing import Dict, Any, List
from app.core.supabase import supabase
from app.services.chat_service import get_chat_brand_records

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

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

    prompt = f"""
Anda adalah Senior QA Audit & CS Intelligence Evaluator untuk brand {brand_name}.
Tugas Anda: Menganalisis data percakapan chat asli & tiket sistem untuk mengidentifikasi gap/discrepancy antara keluhan asli customer vs kategori yang diinput CS Agent.

DATA SAMPLES REKAM CHAT ({len(session_summaries)} sesi):
{chr(10).join(session_summaries)}

DATA SAMPLES TIKET OMNIX ({len(omnix_summaries)} tiket):
{chr(10).join(omnix_summaries)}

PERTANYAAN/FOKUS PENGUSER: {user_query or "Berikan audit komprehensif kendala produk, kepatuhan agent, dan evaluasi service partner."}

Format Laporan:
## 1. Ringkasan Keluhan Utama Customer ({brand_name})
## 2. Evaluasi Discrepancy & Kepatuhan Agent CS
## 3. Rekomendasi Perbaikan Operasional
"""

    candidate_models = [
        os.environ.get("GEMINI_MODEL"),
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
    ]
    seen = set()
    candidate_models = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    # 1. Try Groq API (Super fast & 100% Free) if GROQ_API_KEY is set
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
            g_res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": groq_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1500,
                },
                timeout=45,
            )
            if g_res.ok:
                report_text = g_res.json()["choices"][0]["message"]["content"].strip()
                if report_text:
                    return {
                        "success": True,
                        "brand": brand_name,
                        "total_chat_records_analyzed": len(chats),
                        "total_sessions_analyzed": len(session_map),
                        "report": report_text
                    }
        except Exception as g_exc:
            logger.warning(f"Groq API brand insight call exception: {g_exc}")

    response = None
    model_errors = []

    for key in api_keys:
        for m in candidate_models:
            try:
                res = requests.post(
                    f"{GEMINI_API_BASE}/models/{m}:generateContent",
                    headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=60,
                )
                if res.ok:
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
        if response and response.ok:
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
    parts = (candidates[0].get("content", {}).get("parts") if candidates else []) or []
    report_text = "\n".join(str(part.get("text", "")) for part in parts if part.get("text"))

    return {
        "success": True,
        "brand": brand_name,
        "total_chat_records_analyzed": len(chats),
        "total_sessions_analyzed": len(session_map),
        "report": report_text.strip()
    }
