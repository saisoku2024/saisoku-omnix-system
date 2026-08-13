from app.services.knowledge_service import _generate_answer, _indicator_query_terms, extract_knowledge_entities


def test_extract_knowledge_entities_for_indicator_chunk():
    document = {
        "id": "doc-1",
        "title": "Buku Manual dan Kartu Garansi Ecovacs T30C MAX OMNI.pdf",
        "source_file": "manual.pdf",
    }
    chunk = {
        "id": "chunk-1",
        "document_id": "doc-1",
        "title": document["title"],
        "content": (
            "Lampu Indikator pada Robot. Putih Solid berarti baterai penuh. "
            "Merah Berkedip berarti alarm. Indikator Status Wi-Fi putih solid "
            "berarti berhasil terhubung. OMNI Station merah berkedip berarti error."
        ),
    }

    entities = extract_knowledge_entities(document, chunk)
    indexed = {(row["entity_type"], row["normalized_value"]) for row in entities}

    assert ("brand", "ECOVACS") in indexed
    assert ("product_code", "T30C") in indexed
    assert ("series", "T30") in indexed
    assert ("topic", "INDICATOR_STATUS") in indexed
    assert ("topic", "WIFI_STATUS") in indexed
    assert ("topic", "OMNI_STATION") in indexed


def test_indicator_query_terms_expand_product_series():
    terms = _indicator_query_terms("lampu indikator t30c max omni")

    assert terms["is_indicator_query"] is True
    assert "T30C" in terms["product_codes"]
    assert "T30" in terms["series"]
    assert ["lampu", "indikator"] in terms["topic_groups"]


def test_llm_fallback_does_not_dump_raw_context(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEYS", raising=False)

    answer = _generate_answer(
        "lampu indikator t30c",
        [
            {
                "title": "Sensitive Internal SOP",
                "content": "RAW_CONTEXT_SHOULD_NOT_BE_RETURNED",
            }
        ],
    )

    assert "RAW_CONTEXT_SHOULD_NOT_BE_RETURNED" not in answer
    assert "Sensitive Internal SOP" not in answer
    assert "AI penyusun jawaban sedang tidak tersedia" in answer
