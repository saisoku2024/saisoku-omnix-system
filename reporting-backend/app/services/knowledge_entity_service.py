import re
from typing import Any, Dict, List, Set

COMPACT_PRODUCT_CODE_RE = re.compile(r"\b[A-Z]{1,6}\d{1,4}[A-Z0-9]*\b", re.IGNORECASE)
PRODUCT_CODE_RE = re.compile(r"\b[A-Z]{1,6}\d{1,4}[A-Z0-9]*(?:\s+(?:PRO|MAX|PRIME|OMNI|PLUS|COMBO|COMPLETE|STATION))*\b", re.IGNORECASE)
MODEL_LINE_RE = re.compile(
    r"\b(?:DEEBOT|ECOVACS|TINECO|LAIFEN|TYMO|YONIEV)?\s*"
    r"[A-Z]{1,6}\d{1,4}[A-Z0-9]*(?:\s+(?:MAX|PRO|PRIME|OMNI|PLUS|COMBO|COMPLETE|STATION)){1,5}\b",
    re.IGNORECASE,
)
BRAND_PATTERNS = {
    "ecovacs": re.compile(r"\b(?:ecovacs|deebot)\b", re.IGNORECASE),
    "tineco": re.compile(r"\btineco\b", re.IGNORECASE),
    "laifen": re.compile(r"\blaifen\b", re.IGNORECASE),
    "tymo": re.compile(r"\btymo\b", re.IGNORECASE),
    "yoniev": re.compile(r"\byoniev\b", re.IGNORECASE),
}
DOCUMENT_TYPE_PATTERNS = {
    "manual": re.compile(r"\b(?:manual|buku panduan|panduan pengguna|user manual)\b", re.IGNORECASE),
    "warranty": re.compile(r"\b(?:garansi|warranty|kartu garansi)\b", re.IGNORECASE),
    "specification": re.compile(r"\b(?:spesifikasi|specification|spec|spek)\b", re.IGNORECASE),
    "troubleshooting": re.compile(r"\b(?:troubleshooting|pemecahan masalah|malafungsi|error)\b", re.IGNORECASE),
}
TOPIC_PATTERNS = {
    "indicator_status": re.compile(
        r"\b(?:lampu indikator|indikator status|status lampu|indikator|berkedip|solid|menyala|padam|dimming|bernapas)\b",
        re.IGNORECASE,
    ),
    "wifi_status": re.compile(r"\b(?:wi-?fi|jaringan|terhubung|tersambung|menyambungkan)\b", re.IGNORECASE),
    "omni_station": re.compile(r"\b(?:omni station|stasiun omni|station|dok|dock|pengisian daya)\b", re.IGNORECASE),
    "robot_status": re.compile(r"\b(?:robot|baterai|tombol daya|tugas dimulai|tugas dijeda|alarm)\b", re.IGNORECASE),
    "charging_status": re.compile(r"\b(?:mengisi daya|pengecasan|charging|baterai penuh|baterai lemah)\b", re.IGNORECASE),
}
INDICATOR_QUERY_RE = re.compile(
    r"\b(?:lampu|indikator|status|kedip|berkedip|solid|menyala|padam|dimming|bernapas|merah|putih|biru|oranye|kuning|auto-empty|suction)\b",
    re.IGNORECASE,
)
INDICATOR_EXPANSION_GROUPS = [
    ["lampu", "indikator"],
    ["status", "lampu"],
    ["indikator", "status"],
    ["wi-fi", "indikator"],
    ["omni", "station", "indikator"],
]


def _normalize_entity_value(value: Any) -> str:
    normalized = re.sub(r"[^A-Z0-9]+", " ", str(value or "").upper()).strip()
    return re.sub(r"\s+", " ", normalized)


def _compact_entity_value(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]+", "", str(value or "").upper())


def _entity_row(
    document_id: str,
    chunk_id: str | None,
    entity_type: str,
    entity_value: str,
    normalized_value: str | None = None,
    confidence: float = 1.0,
    source: str = "regex",
) -> Dict[str, Any]:
    return {
        "document_id": document_id,
        "chunk_id": chunk_id,
        "entity_type": entity_type,
        "entity_value": entity_value.strip(),
        "normalized_value": normalized_value or _normalize_entity_value(entity_value),
        "confidence": confidence,
        "source": source,
    }


def _extract_product_codes(text: str) -> List[str]:
    values: List[str] = []
    for match in COMPACT_PRODUCT_CODE_RE.finditer(text or ""):
        value = _compact_entity_value(match.group(0))
        if len(value) >= 2 and any(char.isdigit() for char in value):
            values.append(value)
    seen: Set[str] = set()
    result: List[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def _series_from_product_code(product_code: str) -> str | None:
    match = re.match(r"^([A-Z]+\d+)", _compact_entity_value(product_code))
    if not match:
        return None
    return match.group(1)


def extract_knowledge_entities(document: Dict[str, Any], chunk: Dict[str, Any]) -> List[Dict[str, Any]]:
    document_id = str(document.get("id") or chunk.get("document_id") or "")
    chunk_id = chunk.get("id") or chunk.get("chunk_id")
    if not document_id:
        return []

    title = str(chunk.get("title") or document.get("title") or "")
    source_file = str(document.get("source_file") or "")
    content = str(chunk.get("content") or "")
    combined_text = f"{title}\n{source_file}\n{content}"

    rows: List[Dict[str, Any]] = []
    for brand, pattern in BRAND_PATTERNS.items():
        if pattern.search(combined_text):
            rows.append(_entity_row(document_id, chunk_id, "brand", brand.title(), brand.upper(), 0.95))

    for product_code in _extract_product_codes(combined_text):
        rows.append(_entity_row(document_id, chunk_id, "product_code", product_code, product_code, 0.95))
        series = _series_from_product_code(product_code)
        if series and series != product_code:
            rows.append(_entity_row(document_id, chunk_id, "series", series, series, 0.9))

    for pattern in [PRODUCT_CODE_RE, MODEL_LINE_RE]:
        for match in pattern.finditer(combined_text):
            model = _normalize_entity_value(match.group(0))
            if any(char.isdigit() for char in model) and len(model) >= 3:
                rows.append(_entity_row(document_id, chunk_id, "model", model, model, 0.85))

    for document_type, pattern in DOCUMENT_TYPE_PATTERNS.items():
        if pattern.search(combined_text):
            rows.append(_entity_row(document_id, chunk_id, "document_type", document_type, document_type.upper(), 0.85))

    for topic, pattern in TOPIC_PATTERNS.items():
        if pattern.search(combined_text):
            rows.append(_entity_row(document_id, chunk_id, "topic", topic, topic.upper(), 0.9))

    deduped: List[Dict[str, Any]] = []
    seen_keys: Set[tuple] = set()
    for row in rows:
        key = (row["document_id"], row.get("chunk_id"), row["entity_type"], row["normalized_value"])
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(row)
    return deduped
