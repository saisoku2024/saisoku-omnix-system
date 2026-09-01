import logging
import re
import pandas as pd
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range

logger = logging.getLogger(__name__)


def _clean_phone(val):
    if not val:
        return ""
    digits = re.sub(r"\D", "", str(val))
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    return digits


def _compute_fallback_top_agents(start: str, end: str):
    """Compute Top Agent by Total and Avg CSAT by joining csat_responses with omnix_cases."""
    try:
        csat_res = (
            supabase.table("csat_responses")
            .select("id,unique_id,rating_csat,created_at")
            .gte("created_at", start)
            .lt("created_at", end)
            .is_("deleted_at", "null")
            .execute()
        )
        csats = csat_res.data or []
        if not csats:
            return [], []

        start_dt = pd.to_datetime(start) - pd.Timedelta(days=7)
        cases_res = (
            supabase.table("omnix_cases")
            .select("ticket_id,customer_hp,agent_name,interaction_at,date_end_interaction")
            .gte("interaction_at", start_dt.strftime("%Y-%m-%d"))
            .lt("interaction_at", end)
            .not_.is_("agent_name", "null")
            .is_("deleted_at", "null")
            .execute()
        )
        cases = cases_res.data or []

        case_map = {}
        for c in cases:
            p = _clean_phone(c.get("customer_hp"))
            agent = str(c.get("agent_name") or "").strip()
            if p and agent and agent not in {"None", "null", "nan", "-"}:
                case_map.setdefault(p, []).append(c)

        agent_ratings = {}
        for cs in csats:
            p = _clean_phone(cs.get("unique_id"))
            rating = cs.get("rating_csat")
            if p in case_map and rating not in (None, "", "null", "nan"):
                try:
                    score = float(str(rating).strip())
                    agent = case_map[p][0].get("agent_name")
                    if agent:
                        agent_ratings.setdefault(agent, []).append(score)
                except Exception:
                    pass

        if not agent_ratings:
            return [], []

        top_total = [
            {"agent": agent, "total": len(scores)}
            for agent, scores in sorted(agent_ratings.items(), key=lambda x: len(x[1]), reverse=True)
        ]

        top_avg = [
            {
                "agent": agent,
                "avg": round(sum(scores) / len(scores), 2),
                "avg_csat": round(sum(scores) / len(scores), 2),
            }
            for agent, scores in sorted(
                agent_ratings.items(),
                key=lambda x: (round(sum(x[1]) / len(x[1]), 2), len(x[1])),
                reverse=True,
            )
        ]

        return top_total, top_avg
    except Exception as e:
        logger.error(f"Error computing fallback top agents: {e}", exc_info=True)
        return [], []


class CsatService:

    # =========================
    # MASTER (ALL) - FINAL 🔥
    # =========================
    @staticmethod
    def get_all(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "get_csat_dashboard",
                {
                    "p_start": start,
                    "p_end": end
                }
            ).execute()

            data = res.data if res.data else {}
            if isinstance(data, list) and data:
                data = data[0] if isinstance(data[0], dict) else {}
            elif not isinstance(data, dict):
                data = {}

            summary = data.get("summary") or {}
            top_total = data.get("top_agent_total") or []
            top_avg = data.get("top_agent_avg") or []

            # If RPC top agents are empty, compute from matched cases
            if not top_total or not top_avg:
                computed_total, computed_avg = _compute_fallback_top_agents(start, end)
                if not top_total:
                    top_total = computed_total
                if not top_avg:
                    top_avg = computed_avg

            return {
                "summary": {
                    "total_response": int(summary.get("total_response") or 0),
                    "high_score": int(summary.get("high_score") or 0),
                    "low_score": int(summary.get("low_score") or 0),
                    "avg_csat": round(float(summary.get("avg_csat") or 0), 2)
                },
                "distribution": data.get("distribution") or [],
                "trend": data.get("trend") or [],
                "top_agent_total": top_total,
                "top_agent_avg": top_avg
            }

        except Exception as e:
            logger.error(f"ERROR CSAT MASTER ALL: {e}", exc_info=True)
            fallback_total, fallback_avg = _compute_fallback_top_agents(start, end)
            return {
                "summary": {
                    "total_response": 0,
                    "high_score": 0,
                    "low_score": 0,
                    "avg_csat": 0.0
                },
                "distribution": [],
                "trend": [],
                "top_agent_total": fallback_total,
                "top_agent_avg": fallback_avg
            }